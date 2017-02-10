'use strict';

let _ = require('underscore');
let Gateway = require('./gateway').Gateway;
let MerchantAccount = require('./merchant_account').MerchantAccount;
let PaginatedResponse = require('./paginated_response').PaginatedResponse;
let exceptions = require('./exceptions');

class MerchantAccountGateway extends Gateway {
  constructor(gateway) {
    super();
    this.gateway = gateway;
    this.config = this.gateway.config;
  }

  create(attributes, callback) {
    return this.gateway.http.post(`${this.config.baseMerchantPath()}/merchant_accounts/create_via_api`, {merchantAccount: attributes}, this.responseHandler(callback));
  }

  update(id, attributes, callback) {
    return this.gateway.http.put(`${this.config.baseMerchantPath()}/merchant_accounts/${id}/update_via_api`, {merchantAccount: attributes}, this.responseHandler(callback));
  }

  find(id, callback) {
    if (id.trim() === '') {
      return callback(exceptions.NotFoundError('Not Found'), null); // eslint-disable-line new-cap
    }

    return this.gateway.http.get(`${this.config.baseMerchantPath()}/merchant_accounts/${id}`, function (err, response) {
      if (err) {
        return callback(err, null);
      }

      return callback(null, new MerchantAccount(response.merchantAccount));
    });
  }

  responseHandler(callback) {
    return this.createResponseHandler('merchantAccount', MerchantAccount, callback);
  }

  all(callback) {
    let response = new PaginatedResponse(this.fetchMerchantAccounts.bind(this));

    if (callback != null) {
      return response.all(callback);
    }

    response.ready();
    return response.stream;
  }

  fetchMerchantAccounts(pageNumber, callback) {
    return this.gateway.http.get(this.config.baseMerchantPath() + '/merchant_accounts?page=' + pageNumber, function (err, response) {
      let body, merchantAccounts, pageSize, ref, totalItems;

      if (err) {
        return callback(err);
      }

      body = response.merchantAccounts;
      ref = response.merchantAccounts;
      totalItems = ref.totalItems;
      pageSize = ref.pageSize;
      merchantAccounts = body.merchantAccount;
      if (!_.isArray(merchantAccounts)) {
        merchantAccounts = [merchantAccounts];
      }
      return callback(null, totalItems, pageSize, merchantAccounts);
    });
  }

  createForCurrency(attributes, callback) {
    return this.gateway.http.post(this.config.baseMerchantPath() + '/merchant_accounts/create_for_currency', {
      merchantAccount: attributes
    }, this.createForCurrencyResponseHandler(callback));
  }

  createForCurrencyResponseHandler(callback) {
    return this.createResponseHandler(null, null, function (err, response) {
      if (!err && response.success) {
        response.merchantAccount = new MerchantAccount(response.response.merchantAccount);
        delete response.response;
      }
      return callback(err, response);
    });
  }
}

module.exports = {MerchantAccountGateway: MerchantAccountGateway};