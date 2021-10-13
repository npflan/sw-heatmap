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

function changeColor(switchName, switchSubName, switchNum, Color) {

  const isOtherCrew = (switchName === "CREW" && switchSubName === "E3") || (switchName === "CC" && (switchSubName === "D10" || switchSubName === "D11"))
  const isExpo = switchName === "EXPO"
  const isScene = switchName === "SCENE"
  const isShop = switchName === "SHOP"
  const isCr = switchName === "CR"
  const isSoS = switchName === "SOS"
  const isE1 = switchName === "E1"
  const isBillet = switchName === "BILLET"
  if (isOtherCrew || isExpo || isScene || isShop || isCr || isSoS || isE1 || isBillet) {
    $(`#${switchName}${switchNum}${switchSubName}`)
      .children("Rect")
      .css("fill", Color);
    return;
  }

  var lower = 1, upper = 1

  if (
    (switchName >= "FA" && switchName <= "FZ") ||
    (switchName >= "GA" && switchName <= "GF") ||
    (switchName >= "HA" && switchName <= "HM")
  ) {
    upper = 20; // gigabit seats
  } else if (switchName === "CREW") {
    switchName = switchName + switchNum + switchSubName;
    lower = 1;
    upper = 24;
  } else if (switchName >= "CA" && switchName <= "CH") {
    upper = 30; 
  } else { // normal case
    lower = 1; // some tables don't have seat 1,2
    upper = 30;
    if (switchNum == 1) {
      splitFilter = (idx, seat) => {
        let i = parseInt(seat.id.substr(2));
        return i < 11 || (i > 20 && i < 31);
      };
    } else {
      splitFilter = (idx, seat) => {
        let i = parseInt(seat.id.substr(2));
        return i > 30 || (i > 10 && i < 21);
      };
    }
  }

  sLower = lower.toString().padStart(2, "0");
  sUpper = upper.toString().padStart(2, "0");

  console.log(switchName + "" + sLower);
  $.merge(
    $(`#${switchName}${sLower}`).parent().children(),
    $(`#${switchName}${sUpper}`).parent().children(),
  )
  .filter(splitFilter)
  .each((idx, seat) => {
    $(seat)
      .children("Rect")
      .css("fill", Color);
  });
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
        changeColor(jData[i].name, jData[i].switchSubName || "", jData[i].num, swState);
      });
    }
  }, 5000);
});
