import torch
import json
import numpy as np
from NN import PolicyNN

# Paths to your model and normalization stats
PATH_MODEL = 'models/model23.15.9.40.p'
PATH_DATA = 'models/data23.15.9.40.json'
ONNX_EXPORT_PATH = 'models/policy_nn.onnx'

# Load normalization stats (for input shape)
with open(PATH_DATA, 'r') as f:
    json_load = json.loads(f.read())
obs_rms_mean = np.asarray(json_load["obs_rms_mean"])
input_shape = obs_rms_mean.shape[0]
output_shape = 4  # BipedalWalker has 4 actions

# Load the trained PyTorch model
device = 'cpu'
policy_nn = PolicyNN(input_shape=input_shape, output_shape=output_shape).to(device)
policy_nn.load_state_dict(torch.load(PATH_MODEL, map_location=device))
policy_nn.eval()

# Create a dummy input (batch size 1)
dummy_input = torch.randn(1, input_shape, device=device)

# Export to ONNX
torch.onnx.export(
    policy_nn, 
    dummy_input, 
    ONNX_EXPORT_PATH,
    input_names=['state'],
    output_names=['actions', 'log_probs', 'entropy'],
    opset_version=11,
    do_constant_folding=True
)

print(f"Exported PolicyNN to {ONNX_EXPORT_PATH}") 