import { getCollections } from 'fast-api';
export const get = async (req, res) => {
    const { orders } = getCollections();
    // Acessa a coleção de pedidos e envia como resposta
    res.json(orders);
};
