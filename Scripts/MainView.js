var MainView = function (store) {
    this.index = 2;
    this.initialize = function() {
        this.el = $('<div/>');
    };

    this.render = function () {
       


        this.el.html(MainView.template());
        var f = $("#mainForm");
        f.html(MainView.formTemplate({}));



        return this;
    };

    this.onShow = function () {

        //schovame alert
        app.submenuHide();
        

        var self = this, data = {};
        var f = $("#mainForm");

        if (self.iscroll)
            self.iscroll.refresh();
        else
            self.iscroll = new iScroll($('.mainFormScroll')[0], { hScrollbar: true, vScrollbar: false });

        app.waiting(false);
        f.show();

    };

    this.setButtons = function (jp) 
    {
        var self = this;

        var f = $("#mainForm");


    };


    this.clear = function () {

    };

    this.initialize();
}


MainView.template = Handlebars.compile($("#main-tpl").html());
MainView.formTemplate = Handlebars.compile($("#mainForm-template").html());
