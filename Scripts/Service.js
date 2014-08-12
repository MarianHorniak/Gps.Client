var Service = {
    online: false,
    Device: undefined, //device identification
    dataEventWatchID: undefined,
    state: {
        url: undefined,
        DeviceIdentification: undefined,
        name: undefined,
        password: undefined,
        Distance:0, //vzdialenost medzi gps
        //rychlost ? 
        velocity: 0,
        velocityPrevious: 0,
        Events: [], //offline eventy
        enableHighAccuracy: true
    },
    initialize: function (callback) {
        Service.getState();

        app.log("Service.initialize");
        //Cross domain !!!
        $.support.cors = true;
        $.ajaxSetup({
            cache: false,
            timeout: 30000,
            error: function (jqXHR, textStatus, errorThrown) {
                var e = "ERROR";
                switch (jqXHR.status) {
                    case 403: e = "Bad login"; Service.isAuthenticated = false; break;
                    default: e = "Service not found (" + jqXHR.status + "): " + this.url; break;
                }
                Service.online = false;
                app.log(e);
                app.error(e);
            }
        });

        Service.login(callback);
    },
    testOnline: function (callback) {
        Service.getData(1, null,
             function () {
                 Service.online = true;
                 app.info("Application is online"); if (callback) callback();
             },
             function () {
                 Service.online = false;
                 app.info("Application working offline");
                 if (callback) callback();
             }
           );
    },
    initializeBussiness: function (callback) {
        if (Service.online) {
            Service.trySendDataEvents();
        }
        else {
            Service.startSendDataEvents();
            if (callback) callback();
        };
    },
    login: function (callback) {
        Service.testOnline(function () {
            PositionService.startWatch();
            Service.initializeBussiness();
            if (callback) callback();
            //Service.callLogin(callback);
        });
    },
    //callLogin: function (callback) {

    //    app.log("Service.login");
    //    //$("#footermenu").hide();
    //    //PositionService.stopWatch();
    //},

    authorize: function(callback){
         Service.initializeBussiness(function () {
            $("#footermenu").show();
            PositionService.startWatch();
            if (callback) callback();
        });
    },
    logout: function (callback) {
            app.waiting();
            PositionService.stopWatch();
            var s = Service.getState();
            //notify local 
            NotificationLocal.Notify("logout", s, null, null);
    },


    createDataEventCore : function()
    {
     
        var dataEvent = {
            PK: 0,
            City: PositionService.city,
            Address: PositionService.address,
            Device: Globals.getDevice(),
            DeviceIdentification:Service.state.DeviceIdentification,
            Distance: Service.state.Distance ? Service.state.Distance : 0,
            ClientTimeStamp: new Date().toISOString(),
            ClientRequestId : app.createGuid(),
            Latitude: PositionService.lat,
            Longitude: PositionService.lng,
            Accuracy: PositionService.Accuracy,
            Heading: PositionService.Heading, 
            Altitude : PositionService.Altitude, 
            AltitudeAccuracy : PositionService.AltitudeAccuracy,
            Velocity: PositionService.speed ? PositionService.speed : 0
        };

        return dataEvent;
    },

    saveDataEvent: function (actionName) {

        var dataEvent = Service.createDataEventCore();
        //var dataEvent = {
        //    PK: 0,
        //    ActionName: actionName,
        //    City: PositionService.city,
        //    Address: PositionService.address,
        //    Device : Globals.getDevice(),
        //    Distance: Service.state.Distance ? Service.state.Distance : 0,
        //    ClientTimeStamp: new Date().toISOString(),
        //    ClientRequestId : app.createGuid(),
        //    Latitude: PositionService.lat,
        //    Longitude: PositionService.lng,
        //    Accuracy: PositionService.Accuracy,
        //    Heading: PositionService.Heading, //? PositionService.Heading:0,
        //    Altitude : PositionService.Altitude, //?PositionService.Altitude:0,
        //    AltitudeAccuracy : PositionService.AltitudeAccuracy,
        //    Velocity: PositionService.speed ? PositionService.speed : 0
        //};

        dataEvent.ActionName = actionName;

        //log
        app.info('data-event: ' + dataEvent.ActionName);

        if (!Service.state.Events)
            Service.state.Events = [];

        Service.state.Events.push(dataEvent);
        
    },

    startSendDataEvents: function () {
        if (Service.dataEventWatchID)
            window.clearTimeout(Service.dataEventWatchID);
        Service.dataEventWatchID = window.setTimeout(function () { Service.trySendDataEvents(); }, Globals.SendDataEventsTimeout);
    },
    trySendDataEvents: function () {
        if (Service.state.Events && Service.state.Events.length > 0) {
            var dataEvent = Service.state.Events[0];
            if (!dataEvent.Address && dataEvent.ActionName != "EventGEO") {
                try {
                    Map.geocode(dataEvent.Latitude, dataEvent.Longitude, function (a) {
                        if (a) {
                            dataEvent.City = a.City;
                            dataEvent.Address = a.Address;
                        }
                        Service.sendDataEvent(dataEvent);
                    });
                }
                catch (err) {
                    Service.sendDataEvent(dataEvent);
                }
            }
            else
                Service.sendDataEvent(dataEvent);
        }
        else
            Service.startSendDataEvents();
    },
    sendDataEvent: function(dataEvent){
        Service.postData("DataEvent", dataEvent,
                function () {
                    try{
                        Service.state.Events.splice(0, 1);
                        Service.online = true;
                        Service.saveState();
                        app.setOnline();
                    }
                    catch (err) {
                        app.log("Service.trySendDataEvents: " + err);
                    }
                    Service.trySendDataEvents();
                },
                function () {
                    Service.online = false;
                    app.setOnline();
                    Service.startSendDataEvents();
                });
    },
    getState: function () {
        if (!Service.state || !Service.state.url) {
            app.log("Service.getState");
            var s = window.localStorage.getItem("state");
            app.log("Service.getState : " + s);
            if(s)
                Service.state = JSON.parse(s);
            else
                Service.state = {};
        }
        return Service.state;
    },
    saveState: function (action) {
        var Saved = true;

        if (action) {
            app.log("Service.postData canceled: " + action);
            Service.saveDataEvent(action);
        }
        window.localStorage.setItem("state", JSON.stringify(Service.state));
        return Saved;
    },
    postData: function (isTest, data, successDelegate, errorDelegate) {

        var method = Bussiness.parseMethodName(isTest);
        app.log("Service.postData: " + method);
        if (!this.state.url) {
            app.error("Missing service address");
            if (errorDelegate)
                errorDelegate(d);
        }
        else {
            $.post(this.state.url + "/" + method, data)
                .done(function (d) {
                    if (d) {
                        app.log(method + ": OK");
                        if (d.Message) {
                            app.info(d.Message);
                        }

                        if (d.ErrorMessage) {
                            app.log("Service.postData - ErrorMessage: " + d.ErrorMessage);
                            app.error(d.ErrorMessage + " " + this.url);
                            if (errorDelegate)
                                errorDelegate(d);
                        }
                        else if(successDelegate)
                            successDelegate(d);
                    }
                    else if (successDelegate)
                       successDelegate();
                 })
                .fail(function () {
                    app.waiting(false);
                    if (errorDelegate)
                        errorDelegate();
                });
        }
    },

    getData: function (isTest, data, successDelegate, errorDelegate) {

        var method = Bussiness.parseMethodName(isTest);
        app.log("Service.getData: " + method);
        if (!this.state.url) {
            app.error("Missing service address");
            if (errorDelegate)
                errorDelegate();
        }
        else {
            $.get(this.state.url + "/" + method, data)
                .done(function (d) {
                    if (d) {
                        app.log(method + ": OK");
                        if (d.Message) {
                            app.info(d.Message);
                        }

                        if (d.ErrorMessage) {
                            app.log("Service.getData - ErrorMessage: " + d.ErrorMessage);
                            app.error(d.ErrorMessage + " " + this.url);
                            if (errorDelegate)
                                errorDelegate(d);
                            else
                                app.showAlert(d.ErrorMessage + " " + this.url, "Chyba");
                        }
                        else if (successDelegate)
                            successDelegate(d);
                    }
                    else if (successDelegate)
                        successDelegate();
                })
                .fail(function () {
                    app.waiting(false);
                    if (errorDelegate)
                        errorDelegate();
                });
        }
    },

    parseJsonDate: function (jsonDate) {
        if (!jsonDate)
            return undefined;

        var d = Date.parse(jsonDate);
        if (d)
            return new Date(d);

        try{
            var offset = 0; 
            var parts = /\/Date\((-?\d+)([+-]\d{2})?(\d{2})?.*/.exec(jsonDate);

            if (parts[2] == undefined)
                parts[2] = 0;

            if (parts[3] == undefined)
                parts[3] = 0;

            return new Date(+parts[1] + offset + parts[2] * 3600000 + parts[3] * 60000);
        }
        catch (err) {
            return undefined;
        }
    },

    formatJsonDate: function (jsonDate) {
        var d = Service.parseJsonDate(jsonDate);
        if (d)
            return d.getDate() + ". " + (d.getMonth()+1) + ". " + d.getFullYear() + " " + d.toTimeString().substring(0, 5);
        return "";
    }
}