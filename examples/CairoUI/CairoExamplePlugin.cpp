/*
 * DISTRHO Plugin Framework (DPF)
 * Copyright (C) 2012-2019 Filipe Coelho <falktx@falktx.com>
 * Copyright (C) 2019-2021 Jean Pierre Cimalando <jp-dev@inbox.ru>
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose with
 * or without fee is hereby granted, provided that the above copyright notice and this
 * permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD
 * TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN
 * NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL
 * DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER
 * IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
 * CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

#include "DistrhoPlugin.hpp"

#include <string.h>

START_NAMESPACE_DISTRHO

class CairoExamplePlugin : public Plugin
{
public:
    CairoExamplePlugin()
        : Plugin(0, 0, 0)
    {
    }

    const char* getLabel() const
    {
        return "Cairo DPF Example";
    }

    const char* getMaker() const
    {
        return "Jean Pierre Cimalando";
    }

    const char* getLicense() const
    {
        return "ISC";
    }

    uint32_t getVersion() const
    {
        return d_version(1, 0, 0);
    }

    int64_t getUniqueId() const
    {
        return d_cconst('d', 'C', 'a', 'i');
    }

   /**
      Initialize the audio port @a index.@n
      This function will be called once, shortly after the plugin is created.
    */
    void initAudioPort(bool input, uint32_t index, AudioPort& port) override
    {
        // treat meter audio ports as stereo
        port.groupId = kPortGroupMono;

        // everything else is as default
        Plugin::initAudioPort(input, index, port);
    }

    void initParameter(uint32_t index, Parameter& parameter)
    {
        // unused
        (void)index;
        (void)parameter;
    }

    float getParameterValue(uint32_t index) const
    {
        return 0;

        // unused
        (void)index;
    }

    void setParameterValue(uint32_t index, float value)
    {
        // unused
        (void)index;
        (void)value;
    }

    void run(const float** inputs, float** outputs, uint32_t frames)
    {
       /**
          This plugin does nothing, it just demonstrates cairo UI usage.
          So here we directly copy inputs over outputs, leaving the audio untouched.
          We need to be careful in case the host re-uses the same buffer for both inputs and outputs.
        */
        if (outputs[0] != inputs[0])
            std::memcpy(outputs[0], inputs[0], sizeof(float)*frames);
    }
};

Plugin* createPlugin()
{
    return new CairoExamplePlugin;
}

END_NAMESPACE_DISTRHO
