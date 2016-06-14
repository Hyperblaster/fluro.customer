angular.module('fluro.customer', ['fluro.config'])
.service('FluroCustomerService', function($sessionStorage, $localStorage, $q, $injector, Fluro, FluroTokenService) {

    var controller = {};

    ////////////////////////////
    ////////////////////////////

    //Return the session storage by default
    controller.customerStorageLocation = function() {
        return $sessionStorage;
    }

    ////////////////////////////
    ////////////////////////////

    //Login with user credentials
    controller.login = function(credentials) {


        //Get the storage location
        var storage = controller.customerStorageLocation();

        //Login but don't authenticate automatically
        var request = FluroTokenService.login(credentials, {
            disableAutoAuthenticate: true
        });

        ////////////////////////

        function loginComplete(res) {

            //Save the customers details
            storage.$customer = res.data;

            ////////////////////////////////////////
            //console.log('Customer Login Sucess', storage.$customer);
        }

        ////////////////////////

        function loginFailed(res) {
            //console.log('Customer Login Failed', res);
        }

        ////////////////////////

        request.then(loginComplete, loginFailed);

        ////////////////////////

        return request;
    }

    ////////////////////////////
    ////////////////////////////
    ////////////////////////////

    controller.hasExpired = function() {
        var storage = controller.customerStorageLocation();

        if (storage.$customer) {
            var expiry = new Date(storage.$customer.expires);
            var now = new Date();

            return (expiry.getTime() <= now.getTime());
        }
    }


    ////////////////////////////
    ////////////////////////////
    ////////////////////////////

    //This function returns the HTTP config required to authenticate the customers request
    controller.config = function() {

        //Get the storage location
        var storage = controller.customerStorageLocation();

        //If there is no customer then just return null
        if (!storage.$customer || !storage.$customer.token) {
            return;
        }

        //Create the configuration object
        var config = {}

        //Bypass the default Fluro interceptor
        config.bypassInterceptor = true;

        ////////////////////////////////////////

        // //Include the bearer token in the request
        config.headers = {
            Authorization: 'Bearer ' + storage.$customer.token
        }

        ////////////////////////////////////////
        ////////////////////////////////////////

        //Now delay the in flight request
        var deferred = $q.defer();

        //Check if the token might expire
        if (storage.$customer.expires) {

            //Check if it's expired
            var expired = controller.hasExpired();
     
            //We've expired
            if (expired) {

                //Wait for a result
                function refreshSuccess(res) {

                    //Get the new token
                    var newToken = res.data;

                    //Update with the new token
                    config.headers.Authorization = 'Bearer ' + storage.$customer.token;
 					
 					//console.log('Customer refresh success', res);
 					//Finish up and resolve
                    deferred.resolve(config);
                }

                function refreshFailed(res) {
                    //console.log('Customer refresh failed', res)
                    deferred.reject(config);
                }

                //////////////////////////////////////////////

                //Refresh the customer token
                var refreshRequest = controller.refresh();
                refreshRequest.then(refreshSuccess, refreshFailed);

                //////////////////////////////////////////////

            } else {
                //console.log('Customer still logged in', storage.$customer.token);
                config.headers.Authorization = 'Bearer ' + storage.$customer.token;
                deferred.resolve(config);
            }

        } else {
            
            //console.log('Doesnt expire so keep on keeping on')
            config.headers.Authorization = 'Bearer ' + storage.$customer.token;
            deferred.resolve(config);
        }

        //Return the promise
        return deferred.promise;
    }


    //////////////////////////

    //Useful for logging out and destroying the session
    controller.deleteSession = function() {
        var storage = controller.customerStorageLocation();
        delete storage.$customer;
    }

    //////////////////////////
    //////////////////////////
    //////////////////////////

    //Store the inflight request
    var inflightRequest;

    //Refresh the token
    controller.refresh = function() {

        ///////////////////////////////////////////

        //If a token refresh request is already being made
        if (inflightRequest) {
            return inflightRequest;
        }

        ///////////////////////////////////////////

        //Find out what kind of storage we are updating
        var storage = controller.customerStorageLocation();

        //Get the $http service
        var $http = $injector.get('$http');
        var customer = storage.$customer;

        if (customer) {

            //If the customer has a refresh token
            if (customer.refreshToken) {

                //Make the request
                inflightRequest = $http.post(Fluro.apiURL + '/token/refresh', {
                    refreshToken: customer.refreshToken
                });

                ///////////////////////////////////////////////////////

                //Listen for when it's finished and update the session storage
                inflightRequest.success(function(res) {
                    //Finish the inflight request
                    inflightRequest = null;

                    //Update the customer with new token details
                    storage.$customer.refreshToken = res.refreshToken;
                    storage.$customer.token = res.token;
                    storage.$customer.expires = res.expires;

                    //Add in a success callback if needed here
                });

                ///////////////////////////////////////////////////////

                inflightRequest.error(function(res) {

                    //Finish the inflight request
                    inflightRequest = null;

                    //If the refresh token was invalid delete the customer session
                    if (res == 'invalid_refresh_token') {
                        //console.log('your token has expired');
                        controller.deleteSession();
                    } else {
                        //console.log('error refreshing token', res);
                    }

                    //Add in an error callback if needed here
                });

                ///////////////////////////////////////////////////////

                return inflightRequest;
            }
        }
    }

    ////////////////////////////

    return controller;
})