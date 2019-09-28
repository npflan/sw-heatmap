function httpGet(theUrl) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", theUrl, false); // false for synchronous request
  xmlHttp.send(null);
  if (xmlHttp.status != 200) {
    console.log(xmlHttp.status);
    return null;
  }
  return xmlHttp.responseText;
}

function changeColor(switchName, switchNum, Color) {
  if (switchName.length >= 3) {
    $("#" + switchName + switchNum)
      .children("Rect")
      .css("fill", Color);
    return;
  }
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
    return;
  } else if (switchName >= "CA" && switchName <= "CH") {
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
    return;
  }
  if (switchNum === 1) {
    $.merge(
      $("#" + switchName + "03")
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
    return;
  } else {
    $.merge(
      $("#" + switchName + "03")
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
    return;
  }
}

$(document).ready(function() {
  window.setInterval(function() {
    httpResp = httpGet(window.location.origin+"/api");
    if (httpResp === null) {
      $("#NamedSeats")
        .children("g")
        .children("g")
        .each(function() {
          $(this)
            .children("Rect")
            .css("fill", "yellow");
        });
    } else {
      jData = $.parseJSON(httpResp);
      console.log(jData);
      $.each(jData, function(i, item) {
        var swState = "green";
        if (jData[i].state === 0) {
          swState = "red";
        }
        changeColor(jData[i].name, jData[i].num, swState);
      });
    }
  }, 5000);
});
