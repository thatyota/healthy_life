export const protectRoute = async (req, res, next) => {
   // Verifica se esta logado
    if (!req.auth().isAuthenticated) {
        // se nao estiver logado retorna o erro "401" e da uma mensagem
         return res.status(401).json ({ message: "Unauthorized - you must be logged in"})

    }
    // se estiver autorizado passa para a proxima funcao
    next();
}