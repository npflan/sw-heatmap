function changeColor(switchName, switchNum, Color) {
    if (switchNum === 1) {
        $.merge($('#' + switchName + '01').parent().children(),$('#'+ switchName + '40').parent().children()).filter((idx, seat) => { let i = parseInt(seat.id.substr(2)); return i < 11 || (i > 20 && i < 31) }).each((idx, seat) => { $(seat).children('Rect').css('fill', Color);});
    } else {
        $.merge($('#' + switchName + '01').parent().children(),$('#'+ switchName +'40').parent().children()).filter((idx, seat) => { let i = parseInt(seat.id.substr(2)); return i > 30 || (i > 10 && i < 21) }).each((idx, seat) => { $(seat).children('Rect').css('fill', Color);});
    }
    if (switchNum === 0) {
        $.merge($('#' + switchName + '01').parent().children(),$('#'+ switchName +'30').parent().children()).filter((idx, seat) => { let i = parseInt(seat.id.substr(2)); return i < 31 }).each((idx, seat) => { $(seat).children('Rect').css('fill', Color);});
    }
}

/*
SwitchNum:

*/
$(document).ready(function(){
changeColor('XE', 2, 'red')
});