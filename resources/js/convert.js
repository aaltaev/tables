$(function () {
    $("#content").bind("input change", function () {
        $.post("/convert", {md: $("#content").val()}, function (response) {
            $("#md_html").html(response.html)
        })
    })
})