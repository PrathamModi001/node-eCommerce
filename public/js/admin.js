const deleteProduct = (btn) => {
    const productId = btn.parentNode.querySelector('[name=productId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

    // through the fetch method we can delete successfully, but we have to update the page to remove the card. To do that on the go, we will REMOVE the card (article tag wala section from ejs) when we click the button i.e. execute this js file.
    // so we need to select the article.
    const productElement = btn.closest('article');
    
    fetch('/admin/product/' + productId, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf
        }
    })
        .then(result => {return result.json()})
        .then(data => {
            // console.log(data)
            // productElement.remove(); not supported for old so: 
            productElement.parentNode.removeChild(productElement);
        })
        
        .catch(err => console.log(err))
}