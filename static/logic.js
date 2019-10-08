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

const switchMeta = {
  isBasic: ({ id }) => {
    const entry = getBasicEntry(id)
    console.log(`Processing basic entry "${entry.name}"`)
    doBasicProcessing(entry)
  },
  isCustom: ({ id }) => {
    const entry = getCustomEntry(id)
    console.log(`Processing custom entry "${entry.name}"`)
    doCustomprocessing(entry)
  },
}

function changeColor(switchName, switchNum, Color) {
  const crew = new Set(["CR", "SS", "CREW", "SCENE", "GAMECREW"]);
  if (crew.has(switchName)) {
    $(`#${switchName}${switchNum}`)
      .children("Rect")
      .css("fill", Color);
    return;
  }

  var lower = 1, upper = 1
  var splitFilter = (idx, seat) => {
    return true
  }

  if (
    (switchName >= "FA" && switchName <= "FS") ||
    (switchName >= "GA" && switchName <= "GS")
  ) {
    upper = 17; // gigabit seats
  } else if (switchName >= "CA" && switchName <= "CH") {
    upper = 30; 
  } else { // normal case
    lower = 3; // some tables don't have seat 1,2
    upper = 34;
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
    httpResp = httpGet("http://sw-heatmap.sw-heatmap.svc.cluster.local/api");
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
