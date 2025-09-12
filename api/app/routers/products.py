from fastapi import APIRouter
from pydantic import BaseModel
from ..config import settings


router = APIRouter()


class Product(BaseModel):
    name: str
    cost: float


class ProductResponse(Product):
    price: float
    marginPercent: float


@router.post("/test", response_model=ProductResponse)
def test_product(product: Product) -> ProductResponse:
    margin = settings.default_margin_percent / 100.0
    price = product.cost * (1 + margin)
    return ProductResponse(
        name=product.name,
        cost=product.cost,
        price=price,
        marginPercent=settings.default_margin_percent,
    )
