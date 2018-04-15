import app from 'App';

import './index.scss';

class fieldsSelector {
  selectField(fieldItem) {
    if (fieldItem && !fieldItem.required) {
      fieldItem.isShow = !fieldItem.isShow;
    }
    this.isDisabled = !this.resolve.fields.filter(item => item.isShow).length;
    this.isAllSelected = this.resolve.fields.every(item => item.isShow);
  }

  selectAllFields() {
    this.resolve.fields = this.resolve.fields.map(item => {
      item.isShow = item.required ? true : this.isAllSelected;
      return item;
    });
    this.isDisabled = this.resolve.fields.filter(x => x.isShow).length ? false : true;
  }

  $onInit() {
    this.isAllSelected = this.resolve.fields.every(item => item.isShow);
  }
}

app.component('fieldsSelector', {
  template: require('./index.html'),
  bindings: {
    resolve: '<',
    close: '&',
    dismiss: '&',
  },
  controller: fieldsSelector
});
