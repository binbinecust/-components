import app from 'App';
import './service';
import './index.scss';

class DialogNotificationsController {
  constructor($sce) {
    this.services = { $sce };
  }

  render(content) {
    const { $sce } = this.services;
    return $sce.trustAsHtml(content);
  }
}

DialogNotificationsController.$inject = [ '$sce' ];

app.component('dialogNotifications', {
  template: require('./index.html'),
  bindings: {
    resolve: '<',
    close: '&',
    dismiss: '&',
  },
  controller: DialogNotificationsController,
});
