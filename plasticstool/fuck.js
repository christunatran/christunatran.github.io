document.getElementById("fuck").onclick = function () {
    document.getElementById("fuck3").innerHTML = wINdo[Math.floor(Math.random() * wINdo.length)];
}

let wINdo = [ "vomiting leaf", "wandering trill" , "good dull filler", "really thick curve", "winnowy gullet", "random hearth", "full belly", "orange", "loud keyboard", "calculating turn", "burgeoning chest", "zinger"]

let allcolors = ["blue", "green", "yellow", "red", "black", "white", "pink", "purple", "navy", "orange", "turquoise"]

// document.getelementById("fuck").onmouseenter = function () {
//     this.style.backgroundColor = allcolors[Math.floor(Math.random() * wINdo.length)];
// };

document.getElementById("fuck").onmouseover = function () {
    document.getElementById("fuck3").style.color = "blue";

    document.getElementById("fuck3").style.backgroundImage = "conic-gradient(green, red, yellow, red, yellow, green)";

    document.getElementById("book").style.display = "none";

}; // end document.getElementById("...")


document.getElementById("fuck").onmouseout = function () {
    document.getElementById("fuck3").style.color = "red";

    document.getElementById("fuck3").style.backgroundImage = "none";

    document.getElementById("americanfiction").style.opacity = 1;

    document.getElementById("book").style.display = "block";
};