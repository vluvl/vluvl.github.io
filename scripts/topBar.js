function loadTop(){
    fetch('/about_me/top.html')
        .then(response => response.text())
        .then(data =>{
            document.getElementById('top').innerHTML=data;
        });
}
window.onload = loadTop;