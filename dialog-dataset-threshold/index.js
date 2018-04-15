import app from 'App';
import { DataSetType } from 'Constants';

import './index.scss';

class DatasetThresholdController {
  $onInit() {
    this.healthLevelThreshold = JSON.parse(this.resolve.items.healthLevelThreshold);
    this.unit = this.resolve.items.unit || '小时';
    this.maxValue = this.resolve.items.maxValue || 1E5;
    switch (this.resolve.items.mainType) {
      case DataSetType.Agent:
        this.tip = '*健康状态由采集时间与当前系统时间差值的阈值决定，请根据实际情况评估阈值。';
        break;
      case DataSetType.Parser:
        this.tip = '*健康状态由处理时间与当前系统时间差值的阈值决定，请根据实际情况评估阈值。';
        break;
      case DataSetType.Database:
        this.tip = '*健康状态由存储时间与当前系统时间差值的阈值决定，请根据实际情况评估阈值。';
        break;
    }
  }
}

app.component('dialogDatasetThreshold', {
  template: require('./index.html'),
  bindings: {
    resolve: '<',
    close: '&',
    dismiss: '&',
  },
  controller: DatasetThresholdController,
});
