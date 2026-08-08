let currentSaveController = null;

const searchWorker = new Worker("search-worker.js");

searchWorker.onmessage = function(e) {
    const matches = e.data;
    console.log("Matches received:", matches);
    const matchingIds = new Set(matches.map(card => card.id));
    console.log("matchingIds Set:", matchingIds); 
    renderBoard(window.board,"",matchingIds);
};

function searchWithWorker(text) {
    const allCards = [];
    window.board.lists.forEach(list => {
        list.cards.forEach(card => {
            allCards.push({ id: card.id, title: card.title }); // plain object, not a Card instance
        });
    });

    searchWorker.postMessage({ cards: allCards, searchText: text });
}

function generatedId(){
    return Date.now() + Math.random().toString(36).substring(2, 9);
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

class CommandHistory {
    constructor(){
        this.history = [];
        this.redoStack = [];
    }

    execute(command){
        command.execute();
        this.history.push(command);
        this.redoStack = []; 
    }

    undo(){
        const command = this.history.pop();
        if (command) {
            command.undo();
            this.redoStack.push(command);
        }          
    }

    redo(){
        const command = this.redoStack.pop();
        if(command){
            command.execute();
            this.history.push(command);
        }
    }
}

const commandHistory = new CommandHistory();


function createAddCardCommand(list, card) {
    return {
        execute(){
            list.addCard(card);
        },
        undo(){
            list.removeCard(card.id);
        }
    };
}

function createDeleteCardCommand(list,card){
    let originalIndex;
    return{
        execute(){
            originalIndex = list.cards.findIndex(c => c.id === card.id);
            list.removeCard(card.id);
        },
        undo() {
            list.cards.splice(originalIndex, 0, card);
        }
    };
}

function createEditCardCommand(card, newTitle){
    let oldTitle;
    return{
        execute(){
            oldTitle = card.title;
            card.rename(newTitle);
        },
        undo(){
            card.rename(oldTitle);
        }
    };
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

const domObserver = new MutationObserver((mutations) => {
    console.log(`DOM changed: ${mutations.length} mutations`);
});

domObserver.observe(document.getElementById("board"), {
    childList: true,
    subtree: true
});

async function initApp() {
    let board = await loadBoard();

    if(!board){
        board = new Board("My Project");
        board.addList(new List("To Do"));
        board.addList(new List("Doing"));
        board.addList(new List("Done"));    
    }

    window.board = reactive(board, () => {
        renderBoard(window.board, searchInput.value);
        saveBoard(window.board);
    });

    renderBoard(window.board);
}

initApp();

function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}

function observeLazyLoad(element, callback) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                callback();
                observer.unobserve(entry.target);
            }
        });
    });
    observer.observe(element);
}

function renderBoard(board, filterText = "",matchingIds = null){
    const boardEl = document.getElementById("board");
    boardEl.innerHTML = "";

    board.lists.forEach(list => {
        const listDiv = document.createElement("div");

        listDiv.addEventListener("dragover", (e) => {
            e.preventDefault();
        }); 
        listDiv.addEventListener("drop", (e) => {
        const cardId = e.dataTransfer.getData("cardId");
        const fromListId = e.dataTransfer.getData("fromListId");

        const fromList = board.lists.find(l => l.id === fromListId);
        const card = fromList.cards.find(c => c.id === cardId);
        
        fromList.removeCard(cardId);
        list.addCard(card);
       
        });

        listDiv.classList.add("list");

        const heading = document.createElement("h3");
        heading.textContent = list.name;
        listDiv.appendChild(heading);

        list.cards.forEach(card => {
            if(matchingIds && !matchingIds.has(card.id)){
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
                const command = createDeleteCardCommand(list, card);
                commandHistory.execute(command);
 
            }); 
            cardEl.appendChild(deleteButton);   
            
            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.addEventListener("click", () => {
                const newTitle = prompt("Edit title", card.title);
                if (!newTitle) return;

                const command = createEditCardCommand(card, newTitle);
                commandHistory.execute(command);
            });
            cardEl.appendChild(editBtn);            
        });

    const addButton = document.createElement("button")
    addButton.textContent = "+ Add Card"

    addButton.addEventListener("click",() => {
        const title =  prompt("Enter card title");
        if(!title) return;

        const newCard = new Card(title, "");
        const command = createAddCardCommand(list, newCard);
        commandHistory.execute(command);
    });

    const deleteList= document.createElement("button");
    deleteList.innerHTML = "delete"   
    deleteList.addEventListener("click",()=>{
        board.removeList(list.id);

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
    
    });
    boardEl.appendChild(addList);
}


function fakeServerSave(board,signal) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            const success = Math.random() > 0.1;
            if (success) {
                localStorage.setItem("taskFlow-board", JSON.stringify(board));
                resolve("Saved successfully");
            } else {
                reject("Network error — save failed");
            }
        }, 800);

        signal.addEventListener("abort",()=>{
             clearTimeout(timeoutId);
             reject("Save cancelled (newer save started)");
        });
    });
}

async function saveBoard(board) {
    const statusEl = document.getElementById("saveStatus");
    statusEl.textContent = "Saving...";

    try {
        await saveToIndexedDB(board);
        statusEl.textContent = "Saved successfully";
    } catch (error) {
        statusEl.textContent = "Save failed: " + error;
    }
}

async function loadBoard(){
    const plainBoard = await loadFromIndexedDB();
    if (!plainBoard) return null;
    return reviveBoard(plainBoard);
}

 function openDB(){
    return new Promise((resolve,reject) => {
        const request = indexedDB.open("taskFlowDb",1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("boards")) {
                db.createObjectStore("boards", { keyPath: "id" });
            }            
        };
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };

    });
 }

function saveToIndexedDB(board) {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction("boards", "readwrite");
            const store = tx.objectStore("boards");
            
            const plainBoard = JSON.parse(JSON.stringify(board));
            plainBoard.id = "main-board";
            
            const request = store.put(plainBoard);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    });
}

function loadFromIndexedDB() {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction("boards", "readonly");
            const store = tx.objectStore("boards");
            const request = store.get("main-board");

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    });
}


const searchInput = document.getElementById("searchInput");
const debouncedSearch = debounce((e) => {
    const text = e.target.value;
    if (!text) {
        renderBoard(window.board);
    } else {
        searchWithWorker(text);
    }
}, 300);

searchInput.addEventListener("input", debouncedSearch);


function reactive(target,onChange){
    if(typeof target !== "object" || target === null){
        return target;
    }
    return new Proxy(target,{
        get(obj,key){
            const value = obj[key];
            if (typeof value === "object" && value !== null) {
                return reactive(value, onChange);
            }
            return value;            
        },

        set(obj,key,value){
            obj[key] = value;
            onChange();
            return true;            
        }
    });
}



document.addEventListener("keydown",(e)=>{
    if(e.ctrlKey && e.key === "z"){
        commandHistory.undo();
    }
    if (e.ctrlKey && e.key === "y") {
        commandHistory.redo();
    }    

});

