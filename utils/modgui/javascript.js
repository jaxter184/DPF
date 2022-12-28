function(event, funcs) {
    'use strict';

    var portsSymbols = [
        // NOTE fill me!
    ];

    if (event.type === 'start')
    {
        var wasmErrors = [];

        if (typeof(WebAssembly) === "undefined") {
            wasmErrors.push('WebAssembly unsupported');
        } else {
            if (!WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,3,1,0,1,10,14,1,12,0,65,0,65,0,65,0,252,10,0,0,11]))) {
                wasmErrors.push('Bulk Memory Operations unsupported');
            }
            if (!WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,2,8,1,1,97,1,98,3,127,1,6,6,1,127,1,65,0,11,7,5,1,1,97,3,1]))) {
                wasmErrors.push('Importable/Exportable mutable globals unsupported');
            }
        }

        if (wasmErrors.length !== 0) {
            // errors wasmErrors.join('<br>')
            return;
        }

        event.data.pendingChanges = {
            patch: {},
            ports: {},
        };

        var src = document.createElement('script');
        src.setAttribute('async', true);
        src.setAttribute('src',
                         '/resources/module.js?uri='+escape(@DISTRHO_PLUGIN_URI@)+'&r='+VERSION
                         // funcs.get_custom_resource_filename('module.js')
                         );
        src.setAttribute('type', 'text/javascript');
        src.onload = function() {
            Module_@PLUGIN_CLASS@({
                locateFile: function(path, prefix) {
                    return '/resources/'+path+'?uri='+escape(@DISTRHO_PLUGIN_URI@)+'&r='+VERSION
                    // return funcs.get_custom_resource_filename(path);
                },
                postRun: function(module) {
                    // unique class name per instance
                    var className = event.icon.attr("mod-instance").replaceAll('/','_');
                    var classNameLen = module.lengthBytesUTF8(className) + 1;
                    var classNameAlloc = module._malloc(classNameLen);
                    module.stringToUTF8(className, classNameAlloc, classNameLen);
                    event.icon.find('canvas')[0].id = className;

                    // wasm to JS callbacks
                    var cb1 = module.addFunction(function(index, value) {
                        funcs.set_port_value(portsSymbols[index], value);
                    }, 'vif');
                    var cb2 = module.addFunction(function(uri, value) {
                        var jsuri = module.UTF8ToString(uri);
                        var jsvalue = module.UTF8ToString(value);
                        funcs.patch_set(jsuri, 's', jsvalue);
                    }, 'vpp');

                    // create handle
                    var handle = module._modgui_init(classNameAlloc, cb1, cb2);
                    event.data.handle = handle;
                    event.data.module = module;

                    // handle parameter changes received while wasm was being loaded
                    for (var uri in event.data.pendingChanges.patch) {
                        var uriLen = module.lengthBytesUTF8(uri) + 1;
                        var uriAlloc = module._malloc(uriLen);
                        module.stringToUTF8(uri, uriAlloc, uriLen);

                        var value = event.data.pendingChanges.patch[uri];
                        var valueLen = module.lengthBytesUTF8(value) + 1;
                        var valueAlloc = module._malloc(valueLen);
                        module.stringToUTF8(value, valueAlloc, valueLen);

                        module._modgui_patch_set(handle, uriAlloc, valueAlloc);

                        module._free(uriAlloc);
                        module._free(valueAlloc);
                    }
                    for (var symbol in event.data.pendingChanges.ports) {
                        module._modgui_param_set(handle,
                                                 portsSymbols.indexOf(event.symbol),
                                                 event.data.pendingChanges.ports[symbol]);
                    }
                    event.data.pendingChanges = null;

                    // force a resize
                    window.dispatchEvent(new Event('resize'));

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

        event.icon.click(function() {
            event.icon.find('canvas').focus();
        });

        document.head.appendChild(src);
    }
    else if (event.type === 'change')
    {
        if (event.data.handle && event.data.module)
        {
            var handle = event.data.handle;
            var module = event.data.module;

            if (event.uri) {
                var uriLen = module.lengthBytesUTF8(event.uri) + 1;
                var uriAlloc = module._malloc(uriLen);
                module.stringToUTF8(event.uri, uriAlloc, uriLen);

                var valueLen = module.lengthBytesUTF8(event.value) + 1;
                var valueAlloc = module._malloc(valueLen);
                module.stringToUTF8(event.value, valueAlloc, valueLen);

                module._modgui_patch_set(handle, uriAlloc, valueAlloc);

                module._free(uriAlloc);
                module._free(valueAlloc);
            } else {
                module._modgui_param_set(handle, portsSymbols.indexOf(event.symbol), event.value);
            }
        }
        else
        {
            if (event.uri) {
                event.data.pendingChanges.patch[event.uri] = event.value;
            } else {
                event.data.pendingChanges.ports[event.symbol] = event.value;
            }
        }
    }
}
