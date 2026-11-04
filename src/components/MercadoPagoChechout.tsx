import { Wallet } from '@mercadopago/sdk-react';

type MercadoPagoCheckoutType = {
    preferenceId: string;
};

export const MercadoPagoCheckout = ({ preferenceId }: MercadoPagoCheckoutType) => {

    return (
            <Wallet 
            initialization={{ preferenceId, redirectMode: 'self'   }}
            onError={(error) => console.error('Error en el checkout de Mercado Pago:', error)}
            locale="es-AR"
            />
    );
};

export default MercadoPagoCheckout;