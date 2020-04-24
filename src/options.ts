import { loadOptions } from './util';

async function main() {
  console.log('ooooppts');
  const opts = await loadOptions();
  console.log(opts);

  const form = document.querySelector('form');
  form.addEventListener('change', () => {
    console.log('change');
  });
}

window.addEventListener('load', main);
