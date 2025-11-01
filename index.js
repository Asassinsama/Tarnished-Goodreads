import express from "express";
import bodyParser from "body-parser";
import methodOverride from 'method-override'
import pg from "pg";
//import { PrismaClient } from '@prisma/client/edge'
//import { withAccelerate } from '@prisma/extension-accelerate'

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "homura",
  password: "Jmaster10#",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(methodOverride('_method'));

// Set EJS as the view engine
app.set('view engine', 'ejs');



//const prisma = new PrismaClient().$extends(withAccelerate())


//Fetch all items (Read)
/*app.get('/', async (req,res) => {
  try {
    const allItems = await db.query("SELECT * FROM sama ORDER BY id ASC");
    res.render('index', { items: allItems.rows    
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Errorget');
  }
});*/

// Fetch all items
app.get('/', async (req, res) => {
  try {
    const { sort = 'recommendation' } = req.query; // Default to recommendation
    
    let orderByClause;
    switch (sort) {
      case 'name':
        orderByClause = 'name ASC'; // By name Descending
        break;
      case 'date':
        orderByClause = 'date DESC'; // Most recent first
        break;
      case 'recommendation':
      default:
        orderByClause = 'recommendation DESC NULLS LAST'; // Highest rating first, handle nulls
        break;
    }
    
    const allItems = await db.query(`SELECT * FROM sama ORDER BY ${orderByClause}`);
    
    res.render('index', { 
      items: allItems.rows,
      currentSort: sort
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Errorget');
  }
});

// Add an item(name, date, description & recommendation)
app.post('/items', async (req,res) => {
  const { name,image, description, date, recommendation} = req.body;
  try {
    const newItem = await db.query(
      "INSERT INTO sama (name,image, description, date, recommendation) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [ name,image, description, date, recommendation]
    );
    res.redirect('/')
  } catch (error) {
    console.error(err.message);
    res.status(500).send('Server Errorpost');
  }
});


app.post("/items/edit/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, recommendation } = req.body;
  
  try {
    await db.query(
      "UPDATE sama SET name = $1, description = $2, recommendation = $3 WHERE id = $4", 
      [name, description, recommendation, id]
    );
    res.redirect("/");
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error - Update');
  }
}); 

//Delete an item
app.post('/items/delete/:id', async (req,res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM sama WHERE id = $1", [id]);
    res.redirect('/');
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Errordelete');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});