angular.module('fluro.customer', ['fluro.config'])
.service('FluroCustomerService', ['$sessionStorage', '$localStorage', '$q', '$injector', 'Fluro', 'FluroTokenStore', function($sessionStorage, $localStorage, $q, $injector, Fluro, FluroTokenStore) {

    //Create a FluroTokenStore with the key of Customer
    return new FluroTokenStore('customer');
}]);