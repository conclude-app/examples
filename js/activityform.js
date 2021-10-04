function ActivityForm() {

  let _that = this;

  this.responses = {
    'ok': 'Thank you! Your message has been sent.',
    'validation_error': 'Please fill out all required fields.',
    'duplicate_request_error': 'The message was already sent.',
    'disabled_error': 'Form processing has been disabled.',
    'rate_limit_error': 'Too many messages. Please try again.',
    'recaptcha_error': 'Recaptcha error.',
    'domain_error': 'Not a valid domain.',
    'config_error': 'Web connector configuration error.',
  };

  // Validate and post the form
  this.createActivity = function (cid, form) {
    if (!cid) {
      _that.showStatus('config_error');
      return;
    }
    let p = ['cid=' + cid];
    for (let i = 0; i < form.elements.length; i++) {
      const e = form.elements[i];
      if (!e.checkValidity()) {
        e.reportValidity();
        return;
      }
      if (e.value !== '') {
        p.push(encodeURIComponent(e.name) + '=' + encodeURIComponent(e.value));
      }
    }
    fetch('https://api.conclude.app/v1/activity.form/', {
      headers: {
        'Accept': 'application/json; charset=utf-8',
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      },
      method: 'POST',
      body: p.join('&')
    })
      .then(resp => resp.json())
      .then(res => {
        if (res.error) {
          throw(res);
        }
        if (res.status && res.status === 'ok') {
          form.reset();
        }
        _that.showStatus(res.status);
      })
      .catch(err => {
        console.error('activity.form error: ', err);
        _that.showStatus('internal_error');
      });
  };

  // Show a status text after the form has been submitted
  this.showStatus = function (status) {
    if (!status) {
      return;
    }
    document.getElementById('status-message').innerHTML =
      _that.responses[status] ? _that.responses[status] : 'An unexpected error occurred.';
    document.querySelector('.message-container').classList.add('active');
  };

  // Set alternative responses
  this.setResponses = function (responses) {
    _that.responses = responses;
  }

  // Connect the submit button to our form action
  this.connect = function (connId, formId, buttonId, reCASiteKey) {
    document.getElementById(buttonId).addEventListener('click', e => {
      e.preventDefault();
      if (reCASiteKey) {
        grecaptcha.ready(function () {
          grecaptcha.execute(reCASiteKey, {action: 'submit'}).then(token => {
            document.getElementById('recaptcha').value = token;
            _that.createActivity(connId, document.getElementById(formId));
          });
        });
      } else {
        _that.createActivity(connId, document.getElementById(formId));
      }
      return true;
    });
  };
}

var activityForm = new ActivityForm();
