const db = require('./db');

const products = [
    { name: 'Double Espresso', category: 'coffee', icon: 'espresso', desc: 'Single-origin Ethiopian · intense' },
    { name: 'Cappuccino', category: 'coffee', icon: 'cappuccino', desc: 'Velvet foam · cocoa dust' },
    { name: 'Flat White', category: 'coffee', icon: 'flatwhite', desc: 'Silky microfoam · ristretto base' },
    { name: 'Café Latte', category: 'coffee', icon: 'latte', desc: 'Smooth · balanced · warming' },
    { name: 'Green Tea', category: 'tea', icon: 'greentea', desc: 'Sencha · loose-leaf · 75°C' },
    { name: 'Earl Grey', category: 'tea', icon: 'earlgrey', desc: 'Bergamot · cornflower · cream' },
    { name: 'Fresh Mint', category: 'tea', icon: 'mint', desc: 'Moroccan style · lightly sweet' },
    { name: 'Still Water', category: 'water', icon: 'stillwater', desc: 'Chilled · filtered · pure' },
    { name: 'Sparkling', category: 'water', icon: 'sparkling', desc: 'Lightly carbonated · lime optional' },
    { name: 'Date Cookies', category: 'refreshments', icon: 'cookie', desc: 'House-made · cardamom' },
    { name: 'Seasonal Fruit', category: 'refreshments', icon: 'fruit', desc: "Chef's selection · three pieces" },
    { name: 'Medjool Dates', category: 'refreshments', icon: 'dates', desc: 'Premium · served chilled' },
];

function seed() {
    const checkStmt = db.prepare('SELECT count(*) as count FROM products');
    if (checkStmt.get().count > 0) return;

    const insertProduct = db.prepare('INSERT INTO products (name, category, description, icon) VALUES (?, ?, ?, ?)');
    const insertVariant = db.prepare('INSERT INTO product_variants (product_id, name) VALUES (?, ?)');
    const insertOption = db.prepare('INSERT INTO variant_options (variant_id, name, is_default) VALUES (?, ?, ?)');

    products.forEach(p => {
        const info = insertProduct.run(p.name, p.category, p.desc, p.icon);
        const productId = info.lastInsertRowid;

        // Add variants
        if (p.category === 'coffee') {
            const sizeId = insertVariant.run(productId, 'Size').lastInsertRowid;
            insertOption.run(sizeId, 'Single', 0);
            insertOption.run(sizeId, 'Double', 1);
            insertOption.run(sizeId, 'Large', 0);

            const milkId = insertVariant.run(productId, 'Milk').lastInsertRowid;
            insertOption.run(milkId, 'None', 0);
            insertOption.run(milkId, 'Whole', 1);
            insertOption.run(milkId, 'Skim', 0);
            insertOption.run(milkId, 'Oat', 0);
            insertOption.run(milkId, 'Almond', 0);

            const sweetId = insertVariant.run(productId, 'Sweetness').lastInsertRowid;
            insertOption.run(sweetId, 'Unsweetened', 1);
            insertOption.run(sweetId, 'Light', 0);
            insertOption.run(sweetId, 'Regular', 0);
            insertOption.run(sweetId, 'Sugar-free', 0);
        } else if (p.category === 'tea') {
            const sizeId = insertVariant.run(productId, 'Size').lastInsertRowid;
            insertOption.run(sizeId, 'Cup', 1);
            insertOption.run(sizeId, 'Pot', 0);

            const sweetId = insertVariant.run(productId, 'Sweetness').lastInsertRowid;
            insertOption.run(sweetId, 'Unsweetened', 1);
            insertOption.run(sweetId, 'Light', 0);
            insertOption.run(sweetId, 'Regular', 0);
        } else if (p.category === 'water') {
            const sizeId = insertVariant.run(productId, 'Size').lastInsertRowid;
            insertOption.run(sizeId, 'Glass', 1);
            insertOption.run(sizeId, 'Bottle', 0);
        } else if (p.category === 'refreshments') {
            const sizeId = insertVariant.run(productId, 'Size').lastInsertRowid;
            insertOption.run(sizeId, 'Regular', 1);
            insertOption.run(sizeId, 'Large', 0);

            const milkId = insertVariant.run(productId, 'Milk').lastInsertRowid;
            insertOption.run(milkId, 'None', 0);
            insertOption.run(milkId, 'Whole', 1);
            insertOption.run(milkId, 'Skim', 0);
            insertOption.run(milkId, 'Oat', 0);
            insertOption.run(milkId, 'Almond', 0);

            const sweetId = insertVariant.run(productId, 'Sweetness').lastInsertRowid;
            insertOption.run(sweetId, 'Unsweetened', 1);
            insertOption.run(sweetId, 'Light', 0);
            insertOption.run(sweetId, 'Regular', 0);
            insertOption.run(sweetId, 'Sugar-free', 0);
        }
    });

    console.log('Database seeded with products and variants.');
}

seed();
