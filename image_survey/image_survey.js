
let images = [];
for (let i=1; i<=3;i++){
    images.push(`./images/${i}image.jpg`)
}

// const images = ["image1.jpg", "image2.jpg", "image3.jpg"]; // Add your image paths here
let currentIndex = 0;

document.getElementById("image").src = images[currentIndex];

document.getElementById("yesButton").addEventListener("click", () => {
    recordAnswer("yes");
    changeImage();
});

document.getElementById("noButton").addEventListener("click", () => {
    recordAnswer("no");
    changeImage();
});

document.getElementById("fetchResults").addEventListener("click",()=>{
    getStoredAnswers();
})

function recordAnswer(answer) {
    let answers = JSON.parse(localStorage.getItem("answers")) || [];
    answers.push({ answer: answer, image: images[currentIndex] });
    localStorage.setItem("answers", JSON.stringify(answers));
}

function changeImage() {
    currentIndex = (currentIndex + 1) % images.length;
    document.getElementById("image").src = images[currentIndex];
    if (currentIndex >= 2){
        document.getElementById("fetchResults").style.visibility = "visible";
    }
}
function getStoredAnswers() {
    let answers = JSON.parse(localStorage.getItem("answers")) || [];
    console.log(answers);
    // You can also display the answers on the webpage if needed
}