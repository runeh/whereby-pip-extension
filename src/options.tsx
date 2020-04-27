if (process.env.NODE_ENV === 'development') {
  // Must use require here as import statements are only allowed
  // to exist at the top of a file.
  require('preact/debug');
}

import { h, render, FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { setPragma, glob } from 'goober';
import { loadOptions, saveOptions } from './util';
import { Options, Resolution } from './types';

glob`
  body {
    background-color: white;
  }
  
  * {
    box-sizing: border-box;
  }
`;

setPragma(h);

const FrameRateOption: FunctionComponent<{
  label: string;
  helpText: string;
  value: number;
  onChange: (newValue: number) => void;
}> = (props) => {
  const { helpText, label, onChange, value } = props;
  // fixme: could have suggestions.
  return (
    <div>
      <label>
        {label}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.currentTarget.value))}
        />
      </label>
      <p>{helpText}</p>
    </div>
  );
};

const ResolutionOption: FunctionComponent<{
  label: string;
  helpText: string;
  value: Resolution;
  onChange: (newValue: Resolution) => void;
}> = (props) => {
  const { helpText, label, onChange, value } = props;
  const { width, height } = value;
  return (
    <div>
      <p>{label}</p>

      <div>
        <label>
          <input
            type="number"
            value={width}
            onChange={(e) =>
              onChange({ width: Number(e.currentTarget.value), height })
            }
          ></input>
          width
        </label>
      </div>

      <div>
        <label>
          <input
            type="number"
            value={height}
            onChange={(e) =>
              onChange({ width, height: Number(e.currentTarget.value) })
            }
          ></input>
          height
        </label>
      </div>

      <p>{helpText}</p>
    </div>
  );
};

const BooleanOption: FunctionComponent<{
  label: string;
  helpText: string;
  value: boolean;
  onChange: (newValue: boolean) => void;
}> = (props) => {
  const { helpText, label, onChange, value } = props;
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.currentTarget.checked)}
        ></input>
        {label}
      </label>
      <p>{helpText}</p>
    </div>
  );
};

const App: FunctionComponent = () => {
  const [opts, setOpts] = useState<Options | undefined>(undefined);
  const [dirtyOpts, setDirtyOpts] = useState<Options | undefined>(undefined);

  useEffect(() => {
    loadOptions().then((e) => {
      setOpts(e);
      setDirtyOpts(e);
    });
  }, []);

  if (opts === undefined || dirtyOpts === undefined) {
    return null;
  }

  const updateOptions = (changed: Partial<Options>) => {
    setDirtyOpts({ ...dirtyOpts, ...changed });
  };

  const onSave = async () => {
    await saveOptions(dirtyOpts);
    setOpts(dirtyOpts);
  };

  const onCancel = () => {
    setDirtyOpts(opts);
  };

  return (
    <div>
      <h1>Options</h1>

      <p>Some of the options are not properly hooked up yet.</p>

      <BooleanOption
        label="Show mute indicator"
        value={dirtyOpts.showMuteIndicator}
        helpText="Show an indicator on videos that are muted"
        onChange={(showMuteIndicator) => updateOptions({ showMuteIndicator })}
      />

      <BooleanOption
        label="Flip own video"
        value={dirtyOpts.flipSelf}
        helpText="Not implemented! Flip the image of your own video"
        onChange={(flipSelf) => updateOptions({ flipSelf })}
      />

      <BooleanOption
        label="Preserve aspect ratio"
        value={dirtyOpts.keepAspectRatio}
        helpText="Preserve the aspect ratio of the videos, or allow them to be cropped to better fit the PiP window"
        onChange={(keepAspectRatio) => updateOptions({ keepAspectRatio })}
      />

      <BooleanOption
        label="Show names"
        value={dirtyOpts.showNames}
        helpText="Not implemented! Show the name of the person underneath their video"
        onChange={(showNames) => updateOptions({ showNames })}
      />

      <BooleanOption
        label="Show own camera"
        value={dirtyOpts.showOwnVideo}
        helpText="Whether or not to show your own camera in the PiP window"
        onChange={(showOwnVideo) => updateOptions({ showOwnVideo })}
      />
      <FrameRateOption
        label="Frame rate"
        value={dirtyOpts.frameRate}
        helpText="The desired frame rate of the PiP video"
        onChange={(frameRate) => updateOptions({ frameRate })}
      />
      <ResolutionOption
        label="Resolution"
        value={dirtyOpts.videoResolution}
        onChange={(videoResolution) => updateOptions({ videoResolution })}
        helpText="The resolution of the pip video. This affects how sharp the video is, not how big it's shown on your screen"
      />

      <div>
        <button type="button" onClick={onSave}>
          Save
        </button>
        <button type="button" onClick={onCancel}>
          cancel
        </button>
      </div>
    </div>
  );
};

document.querySelector('#loader')?.remove();
render(<App />, document.body);
