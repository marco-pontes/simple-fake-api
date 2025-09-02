import { getCollections } from '@marco-pontes/simple-fake-api';
export const get = async (_req, res) => {
    const { orders } = getCollections();
    // Acessa a coleção de pedidos e envia como resposta
    res.json(orders);
};
//# sourceMappingURL=orders.js.map