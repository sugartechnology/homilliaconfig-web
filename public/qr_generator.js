function generateQRCode(url) {
    var qr = new VanillaQR({
        url: url,
        width: 300,
        height: 300,
        colorLight: "#ffffff",
        colorDark: "#4094C5",
        toTable: false,
        ecclevel: 1,
        noBorder: false,
        borderSize: 4
    });
    var imageElement = qr.toImage("png");
    return imageElement;
}