﻿var app = {
    currentPage: null,
    currentPageName: null,
    isDevice: false,
    mediaNew : null,
    mediaAlert: null,
    clickEvent: "click",
    pages: {},
    showAlert: function (message, title) {

        var ierr = ErrorStorage.hasError(message);


        if (navigator.notification) {
            if (ierr == 0) {
                ErrorStorage.addError(message);
                navigator.notification.alert(message, alertDismissed(message), title, 'OK');
            }
        }
        else {
            
            if (ierr == 0) {
                ErrorStorage.addError(message);
                alert(title ? (title + ": " + message) : message);
                ErrorStorage.removeError(message);
            }
        }
    },
    alertDismissed: function(message) {
        ErrorStorage.removeError(message);
    },

    tabSelector: function (tabName, pageName) {
        var tabCtrl = document.getElementById(tabName);
        var pageToActivate = document.getElementById(pageName);
        for (var i = 0; i < tabCtrl.childNodes.length; i++) {
            var node = tabCtrl.childNodes[i];
            if (node.nodeType == 1) { /* Element */
                node.style.display = (node == pageToActivate) ? 'block' : 'none';
            }
        }
    },


    showConfirm: function (message, title, okCallback, cancelCallback) {
        var ret = true;
        if (navigator.notification) {
            var _callback = function (btn) {
                if (btn === 1) {
                    if (okCallback) okCallback();
                }
                else {
                    if (cancelCallback) cancelCallback();
                    ret = false;
                }
            }
            navigator.notification.confirm(message, _callback, title, 'OK,Cancel');
        } else {
            if (confirm(title ? (title + ": " + message) : message)) {
                if (okCallback) okCallback();
            }
            else {
                if (cancelCallback) cancelCallback();
                ret = false;
            }
        }

        return ret;
    },
    playNew: function(){
        if (app.mediaNew) {
            app.mediaNew.volume = Globals.Media_Volume;
            app.mediaNew.play();
        }
    },

    buttonClickEffect: function (selector)
    {
        var el = $(selector);
        if (!el) return;
        if (el.length < 1) return;

        el.addClass("clicked");
        setTimeout(function () {
            el.removeClass("clicked");
        }, 1000);
    },

    playSound: function (soundFile) {
        window.setTimeout(function () {
            if (soundFile) {
                var toplay = new Audio(soundFile);
                toplay.volume = Globals.Media_Volume;
                toplay.play();
            }
        }, 1);
    },

    info: function (t) {
        $("#jpLog").html(t);
    },

    error: function (t) {
        $("#jpLog").html(t);
    },

    log: function (t) {
        if ($(".waitingDiv").is(":visible")) {
            $(".waitingDiv").html(t);
        }
    
    },
    waiting: function (show) {
        if (show == false)
            $(".waitingDiv").empty().hide();
        else
            $(".waitingDiv").show();
    },
    end: function (callback) {

            app.showConfirm("Stop application ?", "Stop application", function () {
                app.log("app.exitApp");
                navigator.app.exitApp();
            }, callback);
    },

    registerEvents: function () {
        app.log("app.registerEvents");
        var self = this;
        $('body').off('touchmove');
        $('body').on('touchmove', function (event) { event.preventDefault(); });
        $('body').off(app.clickEvent);
        $('body').on(app.clickEvent, '[data-route]', function (event) { app.route($(this).attr("data-route")); });
        $('body').on(app.clickEvent, '#btnNewsClose', function (event) { app.hideNews(); });
        $('body').on(app.clickEvent, '#btnSubmenu', function (event) { app.submenu(); });
        try {
            document.addEventListener("unload", function () {
                app.info("Unload");
                cordova.require('cordova/plugin/powermanagement').release(
                            function () { app.info("powermanagement Release"); },
                            function () { app.info("powermanagement Error Release"); }
                    );
            }, false);
            document.addEventListener("menubutton", function () { e.preventDefault(); app.login(); }, false);
            document.addEventListener("backbutton", function (e) {
                if (app.currentPageName != "main") {
                    e.preventDefault();
                    app.home();
                }
            }, false);

        } catch (err) {
            app.log(err);
        }

        try {
            if (app.isDevice)
                self.mediaNew = new Media(app.getPhoneGapPath() + "audio/sound_order.mp3");
            else
                self.mediaNew = new Audio("audio/sound_order.mp3");
        }
        catch (err) {
            app.log("Media: " + err);
        }
    },
    submenu: function () {
        var el = $('#divsubmenu');
        el.toggle(100);
        var elvis = $(el).is(":visible")
        if(elvis)
            window.setTimeout(function () {
                app.submenuHide();
            }, 5000);
    },
    submenuHide: function () {
        $('#btnactionsadd').removeClass("selected");
        $('#btnactionfuelstatus').removeClass("selected");
        $('#btnactions').removeClass("selected");
        $('#btnpurchase').removeClass("selected");
        $('#btntank').removeClass("selected");
        $('#btnNote').removeClass("selected");
        $('#btnMap').removeClass("selected");
        $('#btnInfo').removeClass("selected");
        $('#btnSet').removeClass("selected");
        $('#divsubmenu').hide(100);
    },
    home: function (refresh) {
        app.route("main");
        if (refresh && app.currentPage && app.currentPage.loadData)
            app.currentPage.loadData();
    },
    login: function () {
        if (this.currentPageName != "login")
            this.route("login");
    },
    route: function (p) {
        app.log("app.route: " + p);
        var self = this;
        var page = this.pages[p];
        if (!page) {
            switch (p) {
                case "jp": page = new JpView(); this.homePage = page; break;
                case "actions": page = new ActionsView(); break;
                case "purchase": page = new PurchaseView(); break;
                case "selectjp": page = new SelectJpView(); break;
                case "map": page = new MapView(); break;
                case "main": page = new MainView(); break;
                case "state": page = new SettingsView(); break;
                case "login": page = new LoginView(); break;
                case "autoaction": page = new AutoActionView(); break;
                default: this.showAlert("Undefined page:" + p, "ERROR"); return;
            }
            this.pages[p] = page;
            $('body').append(page.el);
            page.render();
        }

        //na page zavolat close
        if (this.currentPage)
        {
            if (this.currentPage.close)
            {
                this.currentPage.close();
            }

        }

        this.currentPageName = p;
        this.setFooter();
        this.slidePage(page);
    },
    slidePage: function (page) {
        var currentPageDest, self = this;

        if (!this.currentPage) {
            this.currentPage = page;
            setTimeout(function () {
                if (page.onShow) 
                    page.onShow();
                else
                    app.waiting(false);
            });
            return;
        }

        setTimeout(function () {
            if (this.currentPage !== page) {
                $(self.currentPage.el).hide();
                $(page.el).show();
                self.currentPage = page;
            }
            
            if (page.onShow)
                page.onShow();
            else
                self.waiting(true);
        });
    },


    createGuid : function ()
{
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
},


    fillHtmlElement: function (elementID, elementValue)
    {
        var el = $("#" + elementID);
        if (el)
            el.html(elementValue);
    },

    setOnline: function () {
        $('#jpInfo').html((Service.online ? 'on' : 'off') + " " + (Service.state && Service.state.Events ? Service.state.Events.length : ""));
        $('#jpInfoAdd').html(Globals.AppName+" "+Globals.Version);
    },
    setFooter: function () {
        $("#footermenu").children().removeClass("selected");
        $("#btn" + this.currentPageName).addClass("selected");
    },
    getPhoneGapPath: function () {
        if (app.isDevice) {
            var path = window.location.pathname;
            path = path.substr(path, path.length - 10);
            return 'file://' + path;
        }
        else return "";
    },
    initialize: function () {
        app.log("app.initialize");
        app.log("app.isDevice: " + this.isDevice);
        var self = this;
        this.pages = {};
        this.registerEvents();

        Service.initialize(function () {
            self.home();
        });
    },
    radio: function (el, input)
    {
        var v = input.val();
        $.each(el.children('[data_value]'), function () {
            var $this = $(this);
            if($this.attr('data_value') === v)
                $this.addClass("selected");
            else
                $this.removeClass("selected");
            $this.off(app.clickEvent);
            $this.on(app.clickEvent ,function () {
                $this.siblings().removeClass("selected");
                $this.addClass("selected");
                input.val($this.attr("data_value"));
            });
        });
    }
};

function onLoad() {
    app.isDevice = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/);
    if (app.isDevice) {
        app.clickEvent = "tap";
        document.addEventListener("deviceready", function () { app.initialize(); }, false);
    } else {
        app.clickEvent = "click";
        app.initialize();
    }
    
}


$.event.special.tap = {
    // Abort tap if touch moves further than 10 pixels in any direction
    distanceThreshold: 10,
    // Abort tap if touch lasts longer than half a second
    timeThreshold: 500,
    setup: function () {
        var self = this,
          $self = $(self);

        // Bind touch start
        $self.off('touchstart');
        $self.on('touchstart', function (startEvent) {
            // Save the target element of the start event
            var target = startEvent.target,
              touchStart = startEvent.originalEvent.touches[0],
              startX = touchStart.pageX,
              startY = touchStart.pageY,
              threshold = $.event.special.tap.distanceThreshold,
              timeout;

            function removeTapHandler() {
                clearTimeout(timeout);
                $self.off('touchmove', moveHandler).off('touchend', tapHandler);
            };

            function tapHandler(endEvent) {
                removeTapHandler();

                // When the touch end event fires, check if the target of the
                // touch end is the same as the target of the start, and if
                // so, fire a click.
                if (target == endEvent.target) {
                    $.event.simulate('tap', self, endEvent);
                }
            };

            // Remove tap and move handlers if the touch moves too far
            function moveHandler(moveEvent) {
                var touchMove = moveEvent.originalEvent.touches[0],
                  moveX = touchMove.pageX,
                  moveY = touchMove.pageY;

                if (Math.abs(moveX - startX) > threshold ||
                    Math.abs(moveY - startY) > threshold) {
                    removeTapHandler();
                }
            };

            // Remove the tap and move handlers if the timeout expires
            timeout = setTimeout(removeTapHandler, $.event.special.tap.timeThreshold);

            // When a touch starts, bind a touch end and touch move handler
            $self.off('touchmove');
            $self.on('touchmove', moveHandler).on('touchend', tapHandler);
        });
    }
};


