var Bussiness = {


    setCurrentInfo: function ()
    {
        var dataEvent = Service.createDataEventCore();
        var textToShow = Globals.noDataString;
        if (dataEvent) {
            textToShow  = "Latitude: " + dataEvent.Latitude + Globals.newLineString;
            textToShow += "Longitude: " + dataEvent.Longitude + Globals.newLineString;
            textToShow += "Velocity: " + dataEvent.Velocity + Globals.newLineString;
            textToShow += "Device: " + dataEvent.Device + Globals.newLineString;
            textToShow += "TimeStamp: " + dataEvent.ClientTimeStamp + Globals.newLineString;

            //textToShow += "Status:" + (Service.online ? "on" : "off") + Globals.newLineString;
            //textToShow += "Events:" + (Service.state && Service.state.Events ? Service.state.Events.length : "") + Globals.newLineString;
            //textToShow += "scroll 1 " + Globals.newLineString;
            //textToShow += "scroll 2 " + Globals.newLineString;
            //textToShow += "scroll 3 " + Globals.newLineString;
            //textToShow += "scroll 4 " + Globals.newLineString;
            //textToShow += "scroll 5 " + Globals.newLineString;
            //textToShow += "scroll 6 " + Globals.newLineString;
            //textToShow += "scroll 7 " + Globals.newLineString;

            
        }

        $("#mainViewDetail").html(textToShow);

    },


    getDecimal: function (valueToTransform, digitsNumber)
    {
        var  myDec = 0;
        try{
            
            myDec = parseFloat(valueToTransform);
            myDec = parseFloat(myDec.toFixed(digitsNumber));
        }
        catch (err) {}
        return myDec;
    },

    parseMethodName: function (isTest)
    {
        if (isTest==1) return "Online.ashx?Id=56yyj";
        else return "Gps.ashx?Id=56yyj";
    },

    distanceCalculate: function(DistanceOriginal)
    {
        if(!DistanceOriginal) return 0;
        if (DistanceOriginal == 0) return 0;

        var retDist = DistanceOriginal * Globals.distanceCoef_Default;
        
        retDist = parseFloat(retDist.toFixed(2));
        retDist = Math.abs(retDist);
        return retDist;

    },

    //skontroluje rychlost a status auta, a vyhlasi problem, ak najde
    checkPosition : function()
    {

    },


}