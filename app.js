let idCounter = 1;
function generatedId(){
     return idCounter++;
}

class Card {
    constructor(title, description){
        this.id = generatedId();
        this.title = title;
        this.description = description;
        this.createdAt = Date.now();        
    }
    rename(newTitle){
        this.title = newTitle;
    }
}

class List {
    constructor(name){
        this.id = generatedId();
        this.name = name;
        this.cards = []      
    }
    addCard(card) {
        this.cards.push(card);
    }
    removeCard(cardId) {
        this.cards = this.cards.filter(card => card.id !== cardId);
    }    
}

class Board {
    constructor(name){
        this.id = generatedId();
        this.name = name; 
        this.lists = []      
    }
    addList(list) {
        this.lists.push(list);
    }
    removeList(listId){
        this.lists = this.lists.filter(list => list.id !== listId);
    }
}

function reviveBoard(plainBoard) {
    Object.setPrototypeOf(plainBoard, Board.prototype);

    plainBoard.lists.forEach(list => {
        Object.setPrototypeOf(list, List.prototype);

        list.cards.forEach(card => {
            Object.setPrototypeOf(card, Card.prototype);
        });
    });

    return plainBoard;
}

let board = loadBoard();

if(!board){
    board = new Board("My Project");
    board.addList(new List("To Do"));
    board.addList(new List("Doing"));
    board.addList(new List("Done"));    
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
        
        fromList.removeCard(cardId);
        list.addCard(card);

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
                list.removeCard(card.id);
                saveBoard(board);
                renderBoard(board);
            }); 
            cardEl.appendChild(deleteButton);   
            
            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.addEventListener("click", () => {
                const newTitle = prompt("Edit title", card.title);
                if (!newTitle) return;

                card.rename(newTitle);
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

        const newCard = new Card(title, "");
        list.addCard(newCard);
        saveBoard(board);
        renderBoard(board);
    });

    const deleteList= document.createElement("button");
    deleteList.innerHTML = "delete"   
    deleteList.addEventListener("click",()=>{
        board.removeList(list.id);
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

        const newList = new List(name);
        board.addList(newList);
        saveBoard(board);
        renderBoard(board);        
    });
    boardEl.appendChild(addList);
}


function fakeServerSave(board) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const success = Math.random() > 0.1;
            if (success) {
                localStorage.setItem("taskFlow-board", JSON.stringify(board));
                resolve("Saved successfully");
            } else {
                reject("Network error — save failed");
            }
        }, 800);
    });
}

async function saveBoard(board) {
    const statusEl = document.getElementById("saveStatus");
    statusEl.textContent = "Saving...";

    try {
        const message = await fakeServerSave(board);
        statusEl.textContent = message;
    } catch (error) {
        statusEl.textContent = error;
    }
}

function loadBoard(){
    const data = localStorage.getItem('taskFlow-board');
    if(!data) return null;
    const plainBoard = JSON.parse(data);
    return reviveBoard(plainBoard);
}

renderBoard(board);


const searchInput = document.getElementById("searchInput");
const debouncedSearch = debounce((e) => {
    // searchCards(e.target.value);
    renderBoard(board,e.target.value);
}, 300);

searchInput.addEventListener("input", debouncedSearch);


// const card = {
//     title: "Fix bug",
//     show: function() {
//         console.log(this.title);
//     }
// };

// ❌ WRONG — passing method directly, loses "this"
// button.addEventListener("click", card.show);
// when clicked, "this" is undefined → logs undefined

// ✅ RIGHT — wrap in arrow function, keeps "this" pointing to card
// button.addEventListener("click", () => card.show());
// when clicked, card.show() is called properly → logs "Fix bug"

// Method - 1
// function Card(title, description) {
//     this.id = generatedId();
//     this.title = title;
//     this.description = description;
//     this.createdAt = Date.now();
// }
// Card.prototype.rename = function(newTitle) {
//     this.title = newTitle;
// };
// const c1 = new Card("Fix bug", "urgent");
// c1.rename("Fix login bug");
// console.log(c1.title); // "Fix login bug"


// Method - 2 
// class CardClass {
//     constructor(title, description) {
//         this.id = generatedId();
//         this.title = title;
//         this.description = description;
//         this.createdAt = Date.now();
//     }
//     rename(newTitle) {
//         this.title = newTitle;
//     }
// }
// const c2 = new CardClass("Write docs", "for API");
// c2.rename("Write API docs");
// console.log(c2.title);

// console.log(c1.__proto__ === Card.prototype);
// console.log(c2.__proto__ === CardClass.prototype);

// const card = {
//     title: "Fix bug",
//     show: function() {
//         console.log(this.title);
//     }
// };

// ❌ WRONG — passing method directly, loses "this"
// button.addEventListener("click", card.show);
// when clicked, "this" is undefined → logs undefined

// ✅ RIGHT — wrap in arrow function, keeps "this" pointing to card
// button.addEventListener("click", () => card.show());
// when clicked, card.show() is called properly → logs "Fix bug"

// Method - 1
// function Card(title, description) {
//     this.id = generatedId();
//     this.title = title;
//     this.description = description;
//     this.createdAt = Date.now();
// }
// Card.prototype.rename = function(newTitle) {
//     this.title = newTitle;
// };
// const c1 = new Card("Fix bug", "urgent");
// c1.rename("Fix login bug");
// console.log(c1.title); // "Fix login bug"


// Method - 2 
// class CardClass {
//     constructor(title, description) {
//         this.id = generatedId();
//         this.title = title;
//         this.description = description;
//         this.createdAt = Date.now();
//     }
//     rename(newTitle) {
//         this.title = newTitle;
//     }
// }
// const c2 = new CardClass("Write docs", "for API");
// c2.rename("Write API docs");
// console.log(c2.title);

// console.log(c1.__proto__ === Card.prototype);
// console.log(c2.__proto__ === CardClass.prototype);
