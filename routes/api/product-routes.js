const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
router.get('/', async (req, res) => {
  try {
    // Find all products and include associated Category and Tag data
    const products = await Product.findAll({
      include: [
        { model: Category, as: 'category' },
        { model: Tag, through: ProductTag, as: 'tags' }
      ]
    });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json(error);
  }
});

// get one product
router.get('/:id', async (req, res) => {
  try {
    // Find a single product by its `id` and include associated Category and Tag data
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Tag, through: ProductTag, as: 'tags' }
      ]
    });

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json(error);
  }
});

// create new product
router.post('/', async (req, res) => {
  try {
    // Create a new product
    const product = await Product.create(req.body);

    // If there are associated tagIds, create pairings in the ProductTag model
    if (req.body.tagIds && req.body.tagIds.length) {
      const productTagIdArr = req.body.tagIds.map((tag_id) => ({
        product_id: product.id,
        tag_id,
      }));
      await ProductTag.bulkCreate(productTagIdArr);
    }

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json(error);
  }
});

// update product
router.put('/:id', async (req, res) => {
  try {
    // Update product data
    await Product.update(req.body, {
      where: { id: req.params.id },
    });

    // Find all associated tags from ProductTag
    const productTags = await ProductTag.findAll({
      where: { product_id: req.params.id },
    });

    // Get the current tag_ids and new tag_ids
    const productTagIds = productTags.map(({ tag_id }) => tag_id);
    const newProductTags = req.body.tagIds
      ? req.body.tagIds.filter((tag_id) => !productTagIds.includes(tag_id))
      : [];

    // Create new and remove outdated product tag associations
    await Promise.all([
      ProductTag.destroy({
        where: { id: productTags.filter(({ tag_id }) => !req.body.tagIds.includes(tag_id)).map(({ id }) => id) },
      }),
      ProductTag.bulkCreate(newProductTags.map((tag_id) => ({
        product_id: req.params.id,
        tag_id,
      }))),
    ]);

    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    res.status(400).json(error);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    // Delete one product by its `id` value
    const deletedProduct = await Product.destroy({
      where: { id: req.params.id },
    });

    if (!deletedProduct) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
