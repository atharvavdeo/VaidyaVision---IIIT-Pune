"""
Model definitions for VaidyaVision diagnostic system.
Architectures must exactly match training (iiit-pune.ipynb) 
so saved state_dicts can be loaded.
"""

import torch
import torch.nn as nn
import timm
from torchvision import models


class BrainExpert(nn.Module):
    """EfficientNet-B2 backbone for brain tumor classification (4 classes)."""
    def __init__(self, num_classes: int = 4):
        super().__init__()
        self.backbone = timm.create_model('efficientnet_b2', pretrained=False, num_classes=0, global_pool='avg')
        self.fc = nn.Sequential(
            nn.Linear(1408, 512),
            nn.BatchNorm1d(512),
            nn.Hardswish(),
            nn.Dropout(p=0.4),
            nn.Linear(512, num_classes)
        )

    def forward(self, x):
        features = self.backbone(x)
        return self.fc(features)


class LungExpert(nn.Module):
    """DenseNet121 backbone for lung disease classification (5 classes)."""
    def __init__(self, num_classes: int = 5):
        super().__init__()
        self.backbone = models.densenet121(weights=None)
        num_ftrs = self.backbone.classifier.in_features
        self.backbone.classifier = nn.Identity()
        self.head = nn.Sequential(
            nn.Linear(num_ftrs, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(),
            nn.Dropout(p=0.3),
            nn.Linear(512, num_classes)
        )

    def forward(self, x):
        features = self.backbone(x)
        return self.head(features)


class SkinExpert(nn.Module):
    """ResNet50 backbone for skin disease classification (9 classes)."""
    def __init__(self, num_classes: int = 9):
        super().__init__()
        self.backbone = models.resnet50(weights=None)
        num_ftrs = self.backbone.fc.in_features
        self.backbone.fc = nn.Identity()
        self.head = nn.Sequential(
            nn.Linear(num_ftrs, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(),
            nn.Dropout(p=0.45),
            nn.Linear(512, num_classes)
        )

    def forward(self, x):
        features = self.backbone(x)
        return self.head(features)


class ECGExpert(nn.Module):
    """EfficientNet-B0 backbone for ECG analysis (4 classes)."""
    def __init__(self, num_classes: int = 4):
        super().__init__()
        self.backbone = timm.create_model('efficientnet_b0', pretrained=False, num_classes=0)
        self.head = nn.Sequential(
            nn.Linear(1280, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(),
            nn.Dropout(p=0.3),
            nn.Linear(512, num_classes)
        )

    def forward(self, x):
        features = self.backbone(x)
        return self.head(features)


class ModalityRouter(nn.Module):
    """ResNet34 router to classify image modality (brain/lung/skin/ecg)."""
    def __init__(self):
        super().__init__()
        self.model = models.resnet34(weights=None)
        self.model.fc = nn.Linear(self.model.fc.in_features, 4)

    def forward(self, x):
        return self.model(x)
