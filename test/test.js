fetch("https://www.google.com").then(resp => resp.text()).then(text => {
    document.body.replaceChildren(
        text
    )
});