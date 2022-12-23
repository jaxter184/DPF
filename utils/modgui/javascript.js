function(event, funcs) {
    'use strict';

    if (event.type === 'start')
    {
        window.icon = event.icon;
        var wasmErrors = [];

        if (typeof(WebAssembly) === "undefined") {
            wasmErrors.push('WebAssembly unsupported');
        } else {
            if (!WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,3,1,0,1,10,14,1,12,0,65,0,65,0,65,0,252,10,0,0,11]))) {
                wasmErrors.push('Bulk Memory Operations unsupported');
            }
            if (!WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,8,1,6,0,6,64,25,11,11]))) {
                wasmErrors.push('Exception handling unsupported');
            }
            if (!WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,2,8,1,1,97,1,98,3,127,1,6,6,1,127,1,65,0,11,7,5,1,1,97,3,1]))) {
                wasmErrors.push('Importable/Exportable mutable globals unsupported');
            }
            if (!WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]))) {
                wasmErrors.push('Fixed-Width SIMD unsupported');
            }
        }

        if (wasmErrors.length !== 0) {
            // errors wasmErrors.join('<br>')
            return;
        }

        event.data.pendingChanges = {};

        var src = document.createElement('script');
        src.setAttribute('async', true);
        src.setAttribute('src',
                         '/effect/file/custom?filename=module.js&uri='+escape("urn:distrho:examples:imguisimplegain")+'&r='+VERSION
                         // funcs.get_custom_resource_filename('module.js')
                         );
        src.setAttribute('type', 'text/javascript');
        src.onload = function() {
            Module_mod_wasm_example({
                locateFile: function(path, prefix) {
                    return '/effect/file/custom?filename='+path+'&uri='+escape("urn:distrho:examples:imguisimplegain")+'&r='+VERSION
                    // return funcs.get_custom_resource_filename(path);
                },
                postRun: function(module) {
                    // unique class name per instance
                    window.module = module;
                    var className = event.icon.attr("mod-instance").replaceAll('/','_');
                    var classNameLen = module.lengthBytesUTF8(className) + 1;
                    var classNameAlloc = module._malloc(classNameLen);
                    module.stringToUTF8(className, classNameAlloc, classNameLen);
                    event.icon.find('canvas')[0].id = className;

                    // wasm to JS callbacks
                    var cb = module.addFunction(function(index, value) {
                        funcs.set_port_value("gain" /*funcs.get_port_symbol_for_index(index)*/, value);
                    }, 'vif');

                    // create handle
                    var handle = module._modgui_init(classNameAlloc, cb);
                    event.data.handle = handle;
                    event.data.module = module;

                    // force a resize
                    window.dispatchEvent(new Event('resize'));

                    // handle parameter changes received while wasm was being loaded
                    for (var symbol in event.data.pendingChanges) {
                        event.data.module._modgui_param(event.data.handle,
                                                        4 /*funcs.get_port_index_for_symbol(event.symbol)*/,
                                                        event.data.pendingChanges[symbol]);
                    }
                    event.data.pendingChanges = null;

                    // cleanup
                    module._free(classNameAlloc);
                },
                canvas: (function() {
                    var canvas = event.icon.find('canvas')[0];

                    // As a default initial behavior, pop up an alert when webgl context is lost. To make your
                    // application robust, you may want to override this behavior before shipping!
                    // See http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.15.2
                    canvas.addEventListener('webglcontextlost', function(e) {
                        alert('WebGL context lost. You will need to reload the page.');
                        e.preventDefault();
                    }, false);

                    return canvas;
                })(),
            });
        };

        document.head.appendChild(src);
    }
    else if (event.type === 'change')
    {
        if (event.data.handle && event.data.module) {
            event.data.module._modgui_param(event.data.handle,
                                            4 /*funcs.get_port_index_for_symbol(event.symbol)*/,
                                            event.value);
        } else {
            event.data.pendingChanges[event.symbol] = event.value;
        }
    }
}
