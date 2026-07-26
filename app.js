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

const board = createBoard("My Project");

const todoList = createList("To Do");
const doingList = createList("Doing");
const doneList  = createList("Done");

addListToBoard(board, todoList);
addListToBoard(board, doingList);
addListToBoard(board, doneList);

const card1 = createCard("Fix login bug", "Login button not working on Safari");
const card2 = createCard("Write blog post", "About JS event loop");

addCardToList(todoList,card1);
addCardToList(todoList,card2);

console.log(board);
