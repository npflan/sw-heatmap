function httpGet(theUrl) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", theUrl, false); // false for synchronous request
  xmlHttp.send(null);
  return xmlHttp.responseText;
}

function changeColor(switchName, switchNum, Color) {
  if (
    (switchName >= "FA" && switchName <= "FS") ||
    (switchName >= "GA" && switchName <= "GS")
  ) {
    $.merge(
      $("#" + switchName + "01")
        .parent()
        .children(),
      $("#" + switchName + "17")
        .parent()
        .children()
    ).each((idx, seat) => {
      $(seat)
        .children("Rect")
        .css("fill", Color);
    });
  } else if (switchName >= "CA" && switchName <= "CG") {
    $.merge(
      $("#" + switchName + "01")
        .parent()
        .children(),
      $("#" + switchName + "30")
        .parent()
        .children()
    ).each((idx, seat) => {
      $(seat)
        .children("Rect")
        .css("fill", Color);
    });
  }
  if (switchNum === 1) {
    $.merge(
      $("#" + switchName + "01")
        .parent()
        .children(),
      $("#" + switchName + "34")
        .parent()
        .children()
    )
      .filter((idx, seat) => {
        let i = parseInt(seat.id.substr(2));
        return i < 11 || (i > 20 && i < 31);
      })
      .each((idx, seat) => {
        $(seat)
          .children("Rect")
          .css("fill", Color);
      });
  } else {
    $.merge(
      $("#" + switchName + "01")
        .parent()
        .children(),
      $("#" + switchName + "34")
        .parent()
        .children()
    )
      .filter((idx, seat) => {
        let i = parseInt(seat.id.substr(2));
        return i > 30 || (i > 10 && i < 21);
      })
      .each((idx, seat) => {
        $(seat)
          .children("Rect")
          .css("fill", Color);
      });
  }
}

$(document).ready(function() {
  jData = $.parseJSON(httpGet("https://09177742.ngrok.io"));
  console.log(jData);
  //console.log(joebob);
  //var jData = $.parseJSON(
  //  '[{"name":"AA", "num":1},{"name":"AB", "num":2},{"name":"AC", "num":1},{"name":"AC", "num":2},{"name":"FA","num":1}]'
  //);
  $.each(jData, function(i, item) {
    changeColor(jData[i].name, jData[i].num, "red");
  });
});
