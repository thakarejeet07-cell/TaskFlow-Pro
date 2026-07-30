let idCounter = 1;
function generatedId(){
     return idCounter++;
}


function createCard(title, description){
    return {
        id: generatedId(),
        title: title,
        description: description,
        createdAt: Date.now()
    };
}

function createList(name){
    return {
        id: generatedId(),
        name: name,
        cards: []
    };
}

function createBoard(name){
    return {
        id: generatedId(),
        name: name,
        lists: []
    };
}

function addCardToList(list,card){
    list.cards.push(card);
}

function addListToBoard(board,list){
    board.lists.push(list);
}

let board = loadBoard();

if(!board){
    board = createBoard("My Project");
    addListToBoard(board, createList("To Do"));
    addListToBoard(board, createList("Doing"));
    addListToBoard(board, createList("Done"));
}



function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}

// function searchCards(text) {
//     const lowerText = text.toLowerCase();
//     board.lists.forEach(list => {
//         list.cards.forEach(card => {
//             if (card.title.toLowerCase().includes(lowerText)) {
//                 console.log("Match:", card.title, "in list:", list.name);
//             }
//         });
//     });
// }


function renderBoard(board, filterText = ""){
    const boardEl = document.getElementById("board");
    boardEl.innerHTML = "";

    board.lists.forEach(list => {
        const listDiv = document.createElement("div");

        listDiv.addEventListener("dragover", (e) => {
            e.preventDefault();
        }); 
        listDiv.addEventListener("drop", (e) => {
        const cardId = Number(e.dataTransfer.getData("cardId"));
        const fromListId = Number(e.dataTransfer.getData("fromListId"));

        const fromList = board.lists.find(l => l.id === fromListId);
        const card = fromList.cards.find(c => c.id === cardId);
        
        removeCardFromList(fromList, cardId);
        addCardToList(list, card);

        saveBoard(board);
        renderBoard(board);        
        });

        listDiv.classList.add("list");

        const heading = document.createElement("h3");
        heading.textContent = list.name;
        listDiv.appendChild(heading);

        list.cards.forEach(card => {
            if(filterText && !card.title.toLowerCase().includes(filterText.toLowerCase())){
                return;
            }
            const cardEl = document.createElement("div");
            cardEl.draggable = true;
            cardEl.addEventListener("dragstart" ,(e) => {
                e.dataTransfer.setData("cardId", card.id);
                e.dataTransfer.setData("fromListId", list.id);
            });

            cardEl.classList.add("card");
            cardEl.textContent = card.title;
            listDiv.appendChild(cardEl);

            const deleteButton = document.createElement("button");
            deleteButton.innerHTML = "x"   
            deleteButton.addEventListener("click",()=>{
                removeCardFromList(list,card.id);
                saveBoard(board);
                renderBoard(board);
            }); 
            cardEl.appendChild(deleteButton);   
            
            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.addEventListener("click", () => {
                const newTitle = prompt("Edit title", card.title);
                if (!newTitle) return;

                editCardTitle(list, card.id, newTitle);
                saveBoard(board);
                renderBoard(board);
            });
            cardEl.appendChild(editBtn);            
        });

    const addButton = document.createElement("button")
    addButton.textContent = "+ Add Card"

    addButton.addEventListener("click",() => {
        const title =  prompt("Enter card title");
        if(!title) return;

        const newCard = createCard(title,"");
        addCardToList(list,newCard);
        saveBoard(board);
        renderBoard(board);
    });

    const deleteList= document.createElement("button");
    deleteList.innerHTML = "delete"   
    deleteList.addEventListener("click",()=>{
        removeListFromBoard(board,list.id);
        saveBoard(board);
        renderBoard(board);
    });

    listDiv.appendChild(deleteList);
    listDiv.appendChild(addButton);
    boardEl.appendChild(listDiv);
    });
    const addList = document.createElement("button");
    addList.innerHTML = "+ Add List"

    addList.addEventListener("click",() => {
        const name =  prompt("Enter list name");
        if(!name) return;

        const newList = createList(name);
        addListToBoard(board,newList);
        saveBoard(board);
        renderBoard(board);        
    });
    boardEl.appendChild(addList);
}

function saveBoard(board){
    localStorage.setItem("taskFlow-board",JSON.stringify(board));
}

function loadBoard(){
    const data = localStorage.getItem('taskFlow-board');
    if(!data) return null;
    return JSON.parse(data);
}

function removeCardFromList(list, cardId){
    list.cards = list.cards.filter(card => card.id !== cardId);
} 

function removeListFromBoard(board, listId){
    board.lists = board.lists.filter(list => list.id !== listId);
}

function editCardTitle(list,cardId,newTitle){
    const card = list.cards.find(c => c.id == cardId);
    if (card) {
    card.title = newTitle;
  }
}

renderBoard(board);


const searchInput = document.getElementById("searchInput");
const debouncedSearch = debounce((e) => {
    // searchCards(e.target.value);
    renderBoard(board,e.target.value);
}, 300);

searchInput.addEventListener("input", debouncedSearch);


const testCard = {
    title: "Fix login bug",
    showTitle: function() {
        console.log(this.title);
    }
};


const detached = testCard.showTitle;
detached();
