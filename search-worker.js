self.onmessage = function(e) {
    const {cards,searchText} = e.data;
    const lowerSearch = searchText.toLowerCase();
    const matches = cards.filter(card => 
        card.title.toLowerCase().includes(lowerSearch)
    );

    self.postMessage(matches);
};