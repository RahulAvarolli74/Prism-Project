import torch
import torch.nn as nn
from torch_geometric.nn import GATv2Conv
from pathlib import Path

HIDDEN_DIM = 128
MODEL_PATH = Path(__file__).resolve().with_name("best_of_best.pth")

class DynamicMicroserviceModel(nn.Module):
    def __init__(self, in_channels, num_nodes):
        super().__init__()

        self.hidden = HIDDEN_DIM

        self.service_emb = nn.Embedding(num_nodes, 32)
        self.input_proj = nn.Linear(in_channels + 32, self.hidden)

        self.gat1 = GATv2Conv(self.hidden, self.hidden, heads=4, concat=False)
        self.gat2 = GATv2Conv(self.hidden, self.hidden, heads=4, concat=False)

        self.norm1 = nn.LayerNorm(self.hidden)
        self.norm2 = nn.LayerNorm(self.hidden)

        self.dropout = nn.Dropout(0.3)

        self.lstm = nn.LSTM(self.hidden, self.hidden, batch_first=True, bidirectional=True)
        self.attn = nn.Linear(self.hidden*2, 1)

        self.fc = nn.Sequential(
            nn.Linear(self.hidden*2, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 1)
        )

    def forward(self, seq):
        if not seq:
            raise ValueError("seq must contain at least one graph snapshot")

        time_embeddings = []

        for data in seq:
            x, edge_index = data.x, data.edge_index
            N = x.size(0)

            service_ids = torch.arange(N, device=x.device)
            s_emb = self.service_emb(service_ids)

            x = torch.cat([x, s_emb], dim=1)
            x = self.input_proj(x)

            if edge_index.size(1) > 0:
                h = self.gat1(x, edge_index)
            else:
                h = x

            h = self.norm1(h + x)

            if edge_index.size(1) > 0:
                h2 = self.gat2(h, edge_index)
            else:
                h2 = h

            h = self.norm2(h + h2)
            h = self.dropout(h)

            time_embeddings.append(h)

        h = torch.stack(time_embeddings).permute(1, 0, 2)

        out, _ = self.lstm(h)

        attn_weights = torch.softmax(self.attn(out), dim=1)
        context = torch.sum(attn_weights * out, dim=1)

        return self.fc(context).squeeze()


def load_model(model_path=None):
    checkpoint_path = Path(model_path) if model_path is not None else MODEL_PATH

    if not checkpoint_path.exists():
        raise FileNotFoundError(f"Model checkpoint not found: {checkpoint_path}")

    checkpoint = torch.load(checkpoint_path, map_location="cpu")

    feature_cols = checkpoint["feature_cols"]
    service_map = checkpoint["service_map"]

    model = DynamicMicroserviceModel(
        in_channels=len(feature_cols),
        num_nodes=len(service_map)
    )

    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    return model