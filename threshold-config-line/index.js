import app from 'App';

import './index.scss';

app.component('thresholdConfigLine', {
  template: require('./index.html'),
  bindings: {
    color: '@',
    ngModel: '=?',
    value: '@',
    minValue: '<',
    maxValue: '<',
    percent: '<',
    readonly: '<',
    addon: '@',
  }
});

export default 'thresholdConfigLine';
