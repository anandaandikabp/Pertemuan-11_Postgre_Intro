const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const { body, validationResult, check } = require('express-validator');
const app = express();
const path = require('path');
const port = 3000;
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const session = require('express-session');
const multer  = require('multer');
const pool = require('./db');
const { loadContact, detailContact, addContact, hapusContact, cekDuplikat, updateContact } = require('./utils/contact');

// app.get('/addsync', async (req, res) => {
//     try {
//         const name = "Rhaina"
//         const mobile = "0812345678"
//         const email = "ananda@mail.com"
//         const newCont = await pool.query(`INSERT INTO contacts values
//         ('${name}','${mobile}','${email}') RETURNING *`)
//         res.json(newCont)
//     } catch (err) {
//         console.error(err.message)
//     }
// });

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/img')
    },
    filename: (req, file, cb) => {
      console.log(file)
      cb(null, Date.now() + path.extname(file.originalname))
    }
  })
  
const upload = multer({ storage: storage })

app.set('view engine', 'ejs');
app.use(expressLayouts);

// middleware
app.use((req, res, next) => {
    console.log('Time:', Date.now())
    next()
})

// built in middleware
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

// 3rd party middleware
app.use(morgan('dev'));
app.use(cookieParser('secret'))
app.use(flash());

app.use(session({ 
    cookie: { maxAge: 6000 },
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
 }));

// about
app.get('/about', (req, res, next) => {
    res.render('about', { 
        title: 'Laman About',
        layout: 'layout/main-layout',
    });
});

app.get('/contact', async (req, res) => {
    // const contact = loadContact();
    const query = await pool.query('SELECT * FROM contacts')
    const contact = query.rows;
    res.render('contact', { 
        title: 'Laman Contact',
        layout: 'layout/main-layout',
        contact,
        msg: req.flash('msg'),
    });

});

// tambah data
app.get('/contact/add', (req, res) => {
    res.render('add-contact', {
        title: 'Laman Tambah Contact',
        layout: 'layout/main-layout',
    });
})

// detail
app.get('/contact/:name', async (req, res, next) => {
    // const contact = detailContact(req.params.name);
    const query = await pool.query(`SELECT * FROM contacts WHERE name = '${req.params.name}'`)
    const contact = query.rows [0];
    res.render('detail', { 
        title: 'Laman Detail',
        layout: 'layout/main-layout',
        contact,
    });
    console.log(contact)
});

// proses input data dengan validator
app.post('/contact', upload.single('image'), [
    body('name').custom(async (value) => {
        const query = await pool.query(`SELECT * FROM contacts WHERE lower(name) = lower('${value}')`)
        const duplikat = query.rows [0];
        if (duplikat) {
            throw new Error('Nama sudah digunakan')
        }
        return true;
    }),
    check('email', 'Email tidak valid').isEmail(),
    check('mobile', 'Nomor tidak valid').isMobilePhone('id-ID')
], async (req, res) => {
    const errors = validationResult(req);
    const { name, mobile, email } = req.body
    // const file = req.file
    if (!errors.isEmpty()) {
        res.render('add-contact', {
            title: 'Laman Form Tambah Data',
            layout: 'layout/main-layout',
            errors: errors.array(),
        })
    } else {
        // addContact(req.body)
        await pool.query(`INSERT INTO contacts (name,mobile,email) VALUES (lower('${name}'), lower('${mobile}'), lower('${email}'))`)
        req.flash('msg', 'Data berhasil ditambahkan!')
        res.redirect('/contact')
    }
})

// hapus contact
app.get('/contact/delete/:name', async (req, res) => {
    // const contact = detailContact(req.params.name);
    const query = await pool.query(`SELECT * FROM contacts WHERE name = '${req.params.name}'`)
    const contact = query.rows [0];
    if (!contact) {
        res.status(404);
        res.send('<h1>404</h1>')
    } else {
        // hapusContact(req.params.name);
        const query = await pool.query(`DELETE FROM contacts WHERE name = '${req.params.name}'`)
        req.flash('msg', 'Data berhasil dihapus!')
        res.redirect('/contact');
    }
});

// edit data
app.get('/contact/edit/:name', async (req, res) => {
    // const contact = detailContact(req.params.name);
    const query = await pool.query(`SELECT * FROM contacts WHERE lower(name) = lower('${req.params.name}')`)
    const contact = query.rows [0];
    res.render('edit-contact', {
        title: 'Laman Edit Contact',
        layout: 'layout/main-layout',
        contact,
    });
})

// proses edit
app.post('/contact/update', [
    body('name').custom(async (value, { req }) => {
        const query = await pool.query(`SELECT * FROM contacts WHERE lower(name) = lower('${value}')`)
        const duplikat = query.rows [0];
        if (value !== req.body.oldName && duplikat) {
            throw new Error('Nama sudah digunakan')
        }
        return true;
    }),
    check('email', 'Email tidak valid').isEmail(),
    check('mobile', 'Nomor tidak valid').isMobilePhone('id-ID')
], async (req, res) => {
    const errors = validationResult(req);
    const {  oldName, name, mobile, email } = req.body
    if (!errors.isEmpty()) {
        res.render('edit-contact', {
            title: 'form edit',
            layout: 'layout/main-layout',
            errors: errors.array(),
            contact: req.body,
        })
    } else {
        // updateContact(req.body)
        await pool.query(`UPDATE contacts SET name = '${name}', mobile = '${mobile}', email= '${email}' WHERE lower(name) = lower('${oldName}')`)
        req.flash('msg', 'Data berhasil diupdate!')
        res.redirect('/contact')
    }
})

app.use('/', (req, res) => {
    res.status(404)
    res.send('Not Found 404')
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});