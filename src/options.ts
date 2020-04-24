import { loadOptions } from './util';
import { Controller, Application } from 'stimulus';

class OptionsController extends Controller {
  static targets = [
    'viewport',
    'hideSelfVideo',
    'flipSelfVideo',
    'showMuteIndicator',
    'lockAspectRatio',
    'showGuestNames',
  ];

  viewportTarget: HTMLInputElement;
  hideSelfVideoTarget: HTMLInputElement;
  flipSelfVideoTarget: HTMLInputElement;
  showMuteIndicatorTarget: HTMLInputElement;
  lockAspectRatioTarget: HTMLInputElement;
  showGuestNamesTarget: HTMLInputElement;

  getOptions() {
    const flipSelf = this.lockAspectRatioTarget;
    const checked = flipSelf.checked;
    return { checked };
  }

  connect() {
    console.log('Hello, Stimulus!', this.element);
  }

  onSave() {
    console.log(this.getOptions());
  }

  onCancel() {
    console.log('clicked cancel');
  }
}

async function main() {
  const app = new Application();
  app.register('options', OptionsController);
  app.start();

  // console.log('ooooppts');
  // const opts = await loadOptions();
  // console.log(opts);

  // const form = document.querySelector('form');
  // form.addEventListener('change', () => {
  //   console.log('change');
  // });
}

window.addEventListener('load', main);
