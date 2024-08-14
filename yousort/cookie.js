/* certain characters can't exist in cookies */
const toAscii = (s) => {
    return s.replace("–", "-").replace("≤", "<=").replace("≥", ">=").replace("≠", "!=");
}

const fromAscii = (s) => {
    return s.replace("-", "–").replace("<=", "≤").replace(">=", "≥").replace("!=", "≠");
}

function setCookie(name,value,days) {
    console.log('value => ' + value);
    console.log('value OR => ' + (value || ""));
    eraseCookie(name);
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (toAscii(value) || "")  + expires + "; path=/";
    console.log("cookie = " + document.cookie);
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return fromAscii(c.substring(nameEQ.length,c.length));
    }
    return null;
}
function eraseCookie(name) {   
    document.cookie = name+'=; Max-Age=-99999999;';  
}