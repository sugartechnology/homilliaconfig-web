

function isIphone() {

    if (/iPhone/i.test(navigator.userAgent)) {

        return true;
    }
    return false;
}

function isChrome() {
    var is_chrome = /CriOS/i.test(navigator.userAgent)
    if (is_chrome) {
        return true;
    }
    return false;
}

function isPhone() {

    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        return true;
    }
    return false;
}