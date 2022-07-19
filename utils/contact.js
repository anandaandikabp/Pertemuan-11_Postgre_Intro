const fs = require('fs');

// buat folder jika belum ada
const dirPath = './data';
if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
}
// buat file json jika belum ada
const dataPath = './data/contacts.json';
if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, '[]','utf-8');
}

// load data kontak
const loadContact = () => {
    const file = fs.readFileSync('data/contacts.json','utf-8');
    const contacts = JSON.parse(file);
    return contacts;
};

// menampilkan detail kontak yang dicari
const detailContact = (name) => {
    const contacts = loadContact();
    const contact = contacts.find((contact) => contact.name.toLowerCase() === name.toLowerCase());
    if (!contact) {
        console.log((`${name} tidak ditemukan`));
        return false;
    } else {
        console.log(contact.image);
        console.log(contact.name);
        console.log(contact.email);
        console.log(contact.mobile);
    }
    return contact;
}

// save data
const saveContact = (contacts) => {
    fs.writeFileSync('data/contacts.json', JSON.stringify(contacts));
}

// tambah data
const addContact = (contact) => {
    const contacts = loadContact();
    contacts.push(contact);
    saveContact(contacts);
}

// edit kontak yang dicari
const updateContact = (baruContacts) => {
    const contacts = loadContact();
    const filteredContacts = contacts.filter((contact) => contact.name.toLowerCase() !== baruContacts.oldName.toLowerCase());
    delete baruContacts.oldName;
    filteredContacts.push(baruContacts);
    saveContact(filteredContacts);
}

// hapus data
const hapusContact = (name) => {
    const contacts = loadContact();
    const newContacts = contacts.filter((contact) => contact.name !== name);
    fs.writeFileSync('data/contacts.json', JSON.stringify(newContacts));
    console.log('Thankyou');
};
// cek nama duplikat
const cekDuplikat = (name) => {
    const contacts = loadContact();
    return contacts.find((contact) => contact.name === name);
}

module.exports = { loadContact, detailContact, addContact, cekDuplikat, hapusContact, updateContact };