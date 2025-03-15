document.addEventListener("DOMContentLoaded", () => {
    //get all div elements with an id
    const divs = document.querySelectorAll("div[id]");

    divs.forEach(div => {
        const id = div.id;
        const url = `/about_me/home/${id}.html`;

        //fetch the HTML content
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load ${url}: ${response.statusText}`);
                }
                return response.text();
            })
            .then(htmlContent => {
                div.innerHTML = htmlContent; //insert the content into the div
            })
            .catch(error => {
                console.error(error); //log any errors
            });
    });
});


//notes to self (or whoever inspects this code later):
//fetch(url) means that we send a request to that specific url. This request will return a Promise.
//This Promise can then be processed with .then(...). From the Promise, we get a Response stored in response.
//We can then process the response (notice the lower case, this is just an "object").
//Here is the neat part: response => {...} is basically a function (or at least I see it as one) from which things can be returned (as another Promise)
//So after we check if the response is positive, we can return the contents of the file as text.
//Here is a catch, response.text() is asynchronous, so it also return a Promise for a string
//Another .then(...) can be used to process that Promise and extract the string which is then placed into the div
