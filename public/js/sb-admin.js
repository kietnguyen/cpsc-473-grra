$(function() {
  $("#side-menu").metisMenu();
});

//Loads the correct sidebar on window load,
//collapses the sidebar on window resize.
$(function() {
  $(window).bind("load resize", function() {
    console.log($(this).width());
    if ($(this).width() < 768) {
      $("div.sidebar-collapse").addClass("collapse");
      $(".sidebar-custom").css("width", "100%");
      $(".sidebar-custom").css("background-color", "inherit");
    } else {
      $("div.sidebar-collapse").removeClass("collapse");
      $(".sidebar-custom").css("width", "inherit");
      $(".sidebar-custom").css("height", "auto");
    }
  });
});
