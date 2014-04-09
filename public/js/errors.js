$(document).ready(function () {
	var pathname = window.location.pathname;
	
	//login.jade/////////////////////////////////////
	
	//initialize error popover
    $("#tb_username").popover({
        content: "Invalid username and/or password",
        placement: "left",
        trigger: "manual"
    });

    if (pathname.indexOf("login/error") > 0) {
	    //show the error
	    $("#tb_username").popover("show");
	}

    $("#tb_username").focus(function() {
    	$("#tb_username").popover("hide");
    });

    $("#tb_password").focus(function() {
    	$("#tb_username").popover("hide");
    });
    //end login.jade/////////////////////////////////

    //user_new.jade//////////////////////////////////

    //initialize dialog
    $("#signupErr").dialog({
        modal: true,
        autoOpen: false,
        width: 500,
        draggable: false,
        resizable: false,
        show: {
            effect: "fade",
            duration: 500
        },
        hide: {
            effect: "fade",
            duration: 500
        }
    });

    if (pathname.indexOf("signup/error") > 0) {
	    //show the error
	    $("#signupErr").dialog("open");
	}

	$("#btn_close").click(function () {
        $("#signupErr").dialog("close");
    });
    //end user_new.jade//////////////////////////////


    //login.jade/////////////////////////////////////
    $("#signupSuccess").dialog({
        modal: true,
        autoOpen: false,
        width: 500,
        draggable: false,
        resizable: false,
        show: {
            effect: "fade",
            duration: 500
        },
        hide: {
            effect: "fade",
            duration: 500
        }
    });

    if (pathname.indexOf("user/login/success") > 0) {
        //show the error
        $("#signupSuccess").dialog("open");
    }

    $("#btn_close2").click(function () {
        $("#signupSuccess").dialog("close");
    });
});