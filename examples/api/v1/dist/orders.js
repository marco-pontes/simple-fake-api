import { getCollections } from '@marco-pontes/simple-fake-api';
export const get = async (req, res) => {
    const { orders } = getCollections();
    // Acessa a coleção de pedidos e envia como resposta
    res.json(orders);
};
